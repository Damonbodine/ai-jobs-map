"""
Self-Healing Bot Skeleton
Watches for automation errors and attempts auto-resolution
Falls back to human notification when auto-healing fails
"""
import os
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Optional
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@127.0.0.1:54322/postgres')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('self_healing_bot')

class SelfHealingBot:
    """
    Monitors automation workflows and auto-resolves common errors.
    
    Error Categories:
    1. Transient errors (retries)
    2. Data format errors (auto-transform)
    3. Integration errors (reconnect/fallback)
    4. Rate limiting (backoff)
    5. Unknown errors (notify human)
    """
    
    ERROR_CATEGORIES = {
        'transient': {
            'patterns': ['timeout', 'connection reset', 'temporarily unavailable', '503', '502'],
            'action': 'retry',
            'max_retries': 3,
            'backoff_seconds': [5, 15, 60],
        },
        'rate_limit': {
            'patterns': ['rate limit', '429', 'too many requests', 'throttled'],
            'action': 'exponential_backoff',
            'max_retries': 5,
            'base_backoff': 30,
        },
        'data_format': {
            'patterns': ['invalid json', 'parse error', 'unexpected token', 'format error'],
            'action': 'transform_and_retry',
            'max_retries': 2,
        },
        'auth': {
            'patterns': ['unauthorized', '401', '403', 'invalid token', 'expired'],
            'action': 'refresh_and_retry',
            'max_retries': 1,
        },
        'integration': {
            'patterns': ['connection refused', 'host unreachable', 'dns error'],
            'action': 'reconnect',
            'max_retries': 3,
            'backoff_seconds': [10, 30, 120],
        },
    }
    
    def __init__(self):
        self.conn = psycopg2.connect(DATABASE_URL)
        self.running = False
        self.check_interval = 30  # seconds
        
    def get_db(self):
        """Get a fresh database connection"""
        if self.conn.closed:
            self.conn = psycopg2.connect(DATABASE_URL)
        return self.conn
    
    def classify_error(self, error_message: str) -> dict:
        """Classify error and determine healing action"""
        error_lower = error_message.lower()
        
        for category, config in self.ERROR_CATEGORIES.items():
            for pattern in config['patterns']:
                if pattern.lower() in error_lower:
                    return {
                        'category': category,
                        'action': config['action'],
                        'max_retries': config.get('max_retries', 3),
                        'backoff': config.get('backoff_seconds', [5, 15, 60]),
                    }
        
        return {
            'category': 'unknown',
            'action': 'notify_human',
            'max_retries': 0,
        }
    
    def attempt_heal(self, error_log: dict) -> dict:
        """Attempt to heal the error based on classification"""
        error_msg = error_log.get('error_message', '')
        classification = self.classify_error(error_msg)
        
        result = {
            'attempted': True,
            'action': classification['action'],
            'category': classification['category'],
            'resolved': False,
            'details': '',
        }
        
        if classification['action'] == 'retry':
            result['details'] = 'Will retry with backoff'
            result['resolved'] = False  # Resolution handled by retry logic
            
        elif classification['action'] == 'exponential_backoff':
            result['details'] = 'Applying exponential backoff before retry'
            result['resolved'] = False
            
        elif classification['action'] == 'transform_and_retry':
            result['details'] = 'Attempting data transformation and retry'
            # In production: actually transform the data
            result['resolved'] = True  # Simulated resolution
            
        elif classification['action'] == 'refresh_and_retry':
            result['details'] = 'Refreshing credentials and retrying'
            # In production: refresh OAuth tokens, API keys, etc.
            result['resolved'] = True  # Simulated resolution
            
        elif classification['action'] == 'reconnect':
            result['details'] = 'Reconnecting to external service'
            # In production: reconnect to database, API, etc.
            result['resolved'] = False
            
        elif classification['action'] == 'notify_human':
            result['details'] = 'Unable to auto-heal - notifying human operator'
            result['resolved'] = False
            self.notify_human(error_log, classification)
            
        return result
    
    def notify_human(self, error_log: dict, classification: dict):
        """Send notification to human operator"""
        notification = {
            'timestamp': datetime.now().isoformat(),
            'error_type': error_log.get('error_type'),
            'error_message': error_log.get('error_message'),
            'workflow_id': error_log.get('workflow_id'),
            'classification': classification['category'],
            'requires_attention': True,
        }
        
        # In production: send to Slack, email, SMS, etc.
        logger.warning(f"Human notification required: {json.dumps(notification, indent=2)}")
        
        # Store notification
        conn = self.get_db()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO self_healing_logs 
            (workflow_id, error_type, error_message, healing_action, resolved)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            error_log.get('workflow_id'),
            f"human_notification_{classification['category']}",
            json.dumps(notification),
            'notify_human',
            False
        ))
        conn.commit()
        cur.close()
    
    def process_pending_errors(self):
        """Process any pending errors in the system"""
        conn = self.get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get recent unresolved errors (in production, this would query actual error logs)
        # For now, we'll simulate processing
        cur.execute("""
            SELECT * FROM self_healing_logs 
            WHERE resolved = false 
            AND created_at > NOW() - INTERVAL '1 hour'
            ORDER BY created_at DESC
            LIMIT 10
        """)
        
        pending = cur.fetchall()
        
        for error in pending:
            result = self.attempt_heal(dict(error))
            
            if result['resolved']:
                cur.execute("""
                    UPDATE self_healing_logs 
                    SET resolved = true, resolution_time_seconds = EXTRACT(EPOCH FROM NOW() - created_at)
                    WHERE id = %s
                """, (error['id'],))
                logger.info(f"Auto-healed error {error['id']}: {result['details']}")
            
            conn.commit()
        
        cur.close()
    
    def simulate_workflow_health_check(self, workflow_id: int) -> dict:
        """Simulate a health check for a workflow"""
        # In production: actually check workflow status, run test inputs, etc.
        return {
            'workflow_id': workflow_id,
            'status': 'healthy',
            'last_run': datetime.now().isoformat(),
            'error_rate': 0.02,
            'avg_latency_ms': 250,
        }
    
    def run(self):
        """Main bot loop"""
        self.running = True
        logger.info("Self-healing bot started")
        
        while self.running:
            try:
                self.process_pending_errors()
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
            
            time.sleep(self.check_interval)
    
    def stop(self):
        """Stop the bot"""
        self.running = False
        self.conn.close()
        logger.info("Self-healing bot stopped")


class ProposalGenerator:
    """
    Generates proposals with PRD phases and budget estimates
    """
    
    def __init__(self):
        self.conn = psycopg2.connect(DATABASE_URL)
    
    def generate_estimate(self, workflow_ids: list[int], occupation_id: int) -> dict:
        """Generate cost estimate based on workflows and occupation"""
        cur = self.conn.cursor(cursor_factory=RealDictCursor)
        
        # Get workflow details
        cur.execute("""
            SELECT * FROM automation_workflows 
            WHERE id = ANY(%s)
        """, (workflow_ids,))
        workflows = cur.fetchall()
        
        # Calculate base estimate
        base_hours = sum(float(wf.get('estimated_time_saved_per_day', 4)) for wf in workflows)
        base_price = sum(int(wf.get('base_price', 2997)) for wf in workflows)
        
        # Complexity multiplier based on occupation
        cur.execute("""
            SELECT major_category FROM occupations WHERE id = %s
        """, (occupation_id,))
        occ = cur.fetchone()
        
        complexity_multiplier = 1.0
        if occ:
            # More complex industries
            if occ['major_category'] in ['Computer and Mathematical', 'Architecture and Engineering']:
                complexity_multiplier = 1.3
            elif occ['major_category'] in ['Healthcare Practitioners and Technical', 'Legal']:
                complexity_multiplier = 1.4
        
        estimate = {
            'base_price': round(base_price * complexity_multiplier),
            'setup_hours': round(base_hours * 1.5 * complexity_multiplier, 1),
            'monthly_maintenance': round(97 * len(workflows) * 0.8),
            'complexity_multiplier': complexity_multiplier,
            'workflow_count': len(workflows),
        }
        
        cur.close()
        return estimate
    
    def generate_prd_phases(self, estimate: dict) -> list[dict]:
        """Generate PRD phases based on estimate"""
        total_hours = estimate['setup_hours']
        
        phases = [
            {
                'phase': 1,
                'name': 'Discovery & Requirements',
                'hours': round(total_hours * 0.15, 1),
                'deliverables': ['Requirements doc', 'Workflow map', 'Success criteria'],
            },
            {
                'phase': 2,
                'name': 'Architecture & Design',
                'hours': round(total_hours * 0.2, 1),
                'deliverables': ['System design', 'API specs', 'Data model'],
            },
            {
                'phase': 3,
                'name': 'Development',
                'hours': round(total_hours * 0.4, 1),
                'deliverables': ['Core engine', 'Integrations', 'Self-healing bot'],
            },
            {
                'phase': 4,
                'name': 'Testing & QA',
                'hours': round(total_hours * 0.15, 1),
                'deliverables': ['Test suite', 'Performance tests', 'Security review'],
            },
            {
                'phase': 5,
                'name': 'Deployment & Training',
                'hours': round(total_hours * 0.1, 1),
                'deliverables': ['Production deploy', 'Documentation', 'Training'],
            },
        ]
        
        return phases


# Example usage
if __name__ == "__main__":
    print("=" * 60)
    print("Self-Healing Bot - Demo Mode")
    print("=" * 60)
    
    bot = SelfHealingBot()
    
    # Test error classification
    test_errors = [
        "Connection timeout after 30 seconds",
        "Rate limit exceeded: 429 Too Many Requests",
        "Invalid JSON response: unexpected token at position 42",
        "Unauthorized: Invalid API token",
        "Connection refused: host unreachable",
        "Unknown error occurred",
    ]
    
    print("\n📊 Error Classification Test:")
    for error in test_errors:
        classification = bot.classify_error(error)
        print(f"  '{error[:50]}...'")
        print(f"    → Category: {classification['category']}, Action: {classification['action']}")
    
    # Test proposal generation
    print("\n📝 Proposal Generator Test:")
    generator = ProposalGenerator()
    
    # Simulate estimate
    mock_estimate = {
        'base_price': 4997,
        'setup_hours': 16.0,
        'monthly_maintenance': 147,
        'complexity_multiplier': 1.2,
        'workflow_count': 2,
    }
    
    phases = generator.generate_prd_phases(mock_estimate)
    print(f"  Estimate: ${mock_estimate['base_price']} + ${mock_estimate['monthly_maintenance']}/mo")
    print(f"  Setup: {mock_estimate['setup_hours']} hours")
    print(f"\n  PRD Phases:")
    for phase in phases:
        print(f"    Phase {phase['phase']}: {phase['name']} ({phase['hours']}h)")
    
    print("\n✅ Self-healing bot skeleton ready!")
    print("   Run as service: python scripts/self_healing_bot.py")
