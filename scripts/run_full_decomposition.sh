#!/bin/bash
# Batch decomposition runner - keeps running until all tasks are processed
# Run with: ./scripts/run_full_decomposition.sh

echo "============================================================"
echo "Full Task Decomposition - Continuous Runner"
echo "============================================================"

export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
export OPENROUTER_API_KEY=$(grep OPENROUTER_API_KEY .env.local | cut -d= -f2)

BATCH_NUM=0
TOTAL_PROCESSED=0

while true; do
    BATCH_NUM=$((BATCH_NUM + 1))
    echo ""
    echo "--- Batch $BATCH_NUM ---"
    
    # Run decomposition batch
    python3 scripts/decompose_tasks.py 2>&1 | tail -5
    
    # Check remaining
    REMAINING=$(psql -U postgres -d postgres -t -c "
        SELECT COUNT(*) 
        FROM onet_tasks ot
        LEFT JOIN task_skill_mapping tsm ON ot.id = tsm.onet_task_id
        WHERE tsm.id IS NULL
    " 2>/dev/null | tr -d ' ')
    
    echo "Remaining tasks: $REMAINING"
    
    if [ "$REMAINING" -eq "0" ] 2>/dev/null || [ -z "$REMAINING" ]; then
        echo ""
        echo "✅ All tasks decomposed!"
        echo "Running aggregation..."
        python3 scripts/aggregate_skill_profiles.py
        break
    fi
    
    # Small delay between batches
    sleep 5
done

echo ""
echo "============================================================"
echo "DECOMPOSITION COMPLETE"
echo "============================================================"
