"""
Scrape O*NET task data for all occupations from O*NET OnLine
Uses our existing occupation slugs to match with O*NET SOC codes
"""
import requests
from bs4 import BeautifulSoup
import json
import re
import time
import os
from typing import Optional

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
})

# Map common job titles to O*NET SOC codes (we'll expand this)
SOC_CODE_MAP = {
    # Management
    "chief-executives": "11-1011.00",
    "general-and-operations-managers": "11-1021.00",
    "legislators": "11-1031.00",
    "advertising-and-promotions-managers": "11-2011.00",
    "marketing-managers": "11-2021.00",
    "sales-managers": "11-2031.00",
    "public-relations-managers": "11-2032.00",
    "fundraising-managers": "11-2041.00",
    "financial-managers": "11-3031.00",
    "computers-and-information-systems-managers": "11-3021.00",
    
    # Computer and Mathematical
    "computer-and-information-research-scientists": "15-1221.00",
    "computer-and-information-analysts": "15-1211.00",
    "information-security-analysts": "15-1212.00",
    "computer-programmers": "15-1251.00",
    "software-developers": "15-1252.00",
    "software-quality-assurance-analysts-and-testers": "15-1253.00",
    "web-developers": "15-1254.00",
    "database-administrators": "15-1243.00",
    "network-and-computer-systems-administrators": "15-1244.00",
    "computer-network-support-specialists": "15-1231.00",
    "computer-user-support-specialists": "15-1232.00",
    "computer-network-architects": "15-1241.00",
    "systems-software-developers": "15-1252.00",
    "applications-software-developers": "15-1252.00",
    
    # Healthcare
    "physicians": "29-1062.00",
    "registered-nurses": "29-1141.00",
    "pharmacists": "29-1051.00",
    "medical-and-health-services-managers": "11-9111.00",
    "healthcare-social-workers": "21-1022.00",
    "physical-therapists": "29-1123.00",
    "occupational-therapists": "29-1124.00",
    "respiratory-therapists": "29-1126.00",
    "speech-language-pathologists": "29-1127.00",
    "dentists": "29-1021.00",
    "veterinarians": "29-1131.00",
    "medical-and-clinical-laboratory-technologists-and-technicians": "29-2012.00",
    "dental-hygienists": "29-2021.00",
    "radiologic-technologists": "29-2034.00",
    "pharmacy-technicians": "29-2052.00",
    "surgical-technologists": "29-2055.00",
    "licensed-practical-and-licensed-vocational-nurses": "29-2061.00",
    "medical-assistants": "31-9092.00",
    "medical-secretaries": "43-6013.00",
    "home-health-aides": "31-1121.00",
    "nursing-assistants": "31-1131.00",
    "orderlies": "31-1132.00",
    
    # Education
    "postsecondary-teachers": "25-1000.00",
    "elementary-school-teachers": "25-2021.00",
    "middle-school-teachers": "25-2022.00",
    "secondary-school-teachers": "25-2031.00",
    "special-education-teachers": "25-2050.00",
    "kindergarten-teachers": "25-2012.00",
    "preschool-teachers": "25-2011.00",
    "instructional-coordinators": "25-9031.00",
    "librarians": "25-4021.00",
    "library-techicians": "25-4031.00",
    
    # Business and Financial
    "accountants-and-auditors": "13-2011.00",
    "financial-analysts": "13-2051.00",
    "personal-financial-advisors": "13-2052.00",
    "insurance-underwriters": "13-2053.00",
    "credit-analysts": "13-2041.00",
    "financial-examiners": "13-2061.00",
    "budget-analysts": "13-2011.00",
    "tax-examiners-and-collectors": "13-2081.00",
    "tax-preparers": "13-2082.00",
    "cost-estimators": "13-1051.00",
    "human-resources-specialists": "13-1071.00",
    "human-resources-managers": "11-3111.00",
    "compensation-and-benefits-managers": "11-3111.00",
    "training-and-development-managers": "11-3121.00",
    "labor-relations-specialists": "13-1075.00",
    "logisticians": "13-1081.00",
    "management-analysts": "13-1111.00",
    "meeting- convention-and-event-planners": "13-1121.00",
    "fundraisers": "13-1131.00",
    "market-research-analysts": "13-1161.00",
    "compensation-benefits-and-job-analysis-specialists": "13-1141.00",
    
    # Sales and Related
    "sales-representatives-wholesale-and-manufacturing": "41-1011.00",
    "sales-representatives-services": "41-1012.00",
    "retail-salespersons": "41-2031.00",
    "cashiers": "41-2011.00",
    "counter-and-rental-clerks": "41-2021.00",
    "parts-salespersons": "41-2022.00",
    "telemarketers": "41-9045.00",
    "real-estate-brokers": "41-9041.00",
    "real-estate-sales-agents": "41-9042.00",
    "insurance-sales-agents": "41-3021.00",
    "securities-commodities-and-financial-services-sales-agents": "41-3031.00",
    "travel-agents": "41-3041.00",
    "advertising-sales-agents": "41-3011.00",
    
    # Office and Administrative Support
    "secretaries-and-administrative-assistants": "43-6014.00",
    "receptionists": "43-4171.00",
    "bookkeeping-accounting-and-auditing-clerks": "43-3031.00",
    "payroll-and-timekeeping-clerks": "43-3051.00",
    "billing-and-posting-clerks": "43-3021.00",
    "procurement-clerks": "43-3061.00",
    "court-municipal-and-license-clerks": "43-4031.00",
    "customer-service-representatives": "43-4051.00",
    "eligibility-interviewers-government-programs": "43-4061.00",
    "file-and-record-clerks": "43-4071.00",
    "hotel-front-desk-clerks": "43-4081.00",
    "library-assistants": "43-4121.00",
    "loan-officers": "13-2071.00",
    "new-accounts-clerks": "43-4131.00",
    "order-clerks": "43-5061.00",
    "human-resources-assistants": "43-4161.00",
    "typists-and-word-processors": "43-9022.00",
    "data-entry-keyers": "43-9021.00",
    "office-clerks-general": "43-9061.00",
    "dispatchers": "43-5031.00",
    "production-planning-and-expediting-clerks": "43-5061.00",
    "communications-equipment-operators": "43-5021.00",
    
    # Architecture and Engineering
    "architects-except-landscape-and-naval": "17-1011.00",
    "landscape-architects": "17-1012.00",
    "civil-engineers": "17-2051.00",
    "mechanical-engineers": "17-2141.00",
    "electrical-engineers": "17-2071.00",
    "electronics-engineers-except-computer": "17-2072.00",
    "biomedical-engineers": "17-2041.00",
    "chemical-engineers": "17-2041.00",
    "environmental-engineers": "17-2161.00",
    "industrial-engineers": "17-2112.00",
    "materials-engineers": "17-2131.00",
    "petroleum-engineers": "17-2171.00",
    "computer-hardware-engineers": "17-2061.00",
    "network-and-computer-systems-administrators": "15-1244.00",
    "electronics-engineers": "17-2072.00",
    "drafters": "17-3011.00",
    "engineering-technicians": "17-3023.00",
    "surveyors": "17-1022.00",
    
    # Life, Physical, and Social Science
    "agricultural-and-food-scientists": "19-1011.00",
    "biological-scientists": "19-1021.00",
    "conservation-scientists": "19-1031.00",
    "forest-fire-inspectors-and-prevention-specialists": "33-2022.00",
    "atmospheric-and-space-scientists": "19-2021.00",
    "chemists": "19-2031.00",
    "environmental-scientists": "19-2041.00",
    "geoscientists": "19-2042.00",
    "physicists": "19-2011.00",
    "economists": "19-3011.00",
    "survey-researchers": "19-3022.00",
    "psychologists": "19-3031.00",
    "sociologists": "19-3041.00",
    "urban-and-regional-planners": "19-3051.00",
    "anthropologists": "19-3091.00",
    "geographers": "19-3092.00",
    "historians": "19-3093.00",
    "political-scientists": "19-3094.00",
    "materials-scientists": "19-2031.00",
}

def get_soc_from_slug(slug: str) -> Optional[str]:
    """Get O*NET SOC code from occupation slug"""
    # Direct match
    if slug in SOC_CODE_MAP:
        return SOC_CODE_MAP[slug]
    
    # Try partial matches
    slug_normalized = slug.lower().replace("_", "-")
    for key, value in SOC_CODE_MAP.items():
        if key in slug_normalized or slug_normalized in key:
            return value
    
    return None

def scrape_occupation_tasks(soc_code: str) -> list[dict]:
    """Scrape tasks for an occupation from O*NET OnLine"""
    url = f"https://www.onetonline.org/link/summary/{soc_code}"
    
    try:
        r = session.get(url, timeout=30)
        if r.status_code != 200:
            return []
        
        soup = BeautifulSoup(r.text, 'html.parser')
        tasks = []
        
        # Find the Tasks section
        # O*NET OnLine has tasks in a specific structure
        task_section = soup.find('div', {'id': 't2'}) or soup.find('section', {'id': 'Tasks'})
        
        if not task_section:
            # Try finding by heading
            for heading in soup.find_all(['h2', 'h3']):
                if 'Task' in heading.get_text():
                    task_section = heading.find_next('ul') or heading.find_next('ol')
                    break
        
        if task_section:
            for li in task_section.find_all('li'):
                task_text = li.get_text(strip=True)
                if task_text and len(task_text) > 10:
                    tasks.append({
                        'task_text': task_text,
                        'source': 'onet'
                    })
        
        return tasks
    
    except Exception as e:
        print(f"  Error scraping {soc_code}: {e}")
        return []


if __name__ == "__main__":
    print("=" * 60)
    print("O*NET Task Scraper")
    print("=" * 60)
    
    # Test with a few occupations
    test_codes = [
        ("software-developers", "15-1252.00"),
        ("registered-nurses", "29-1141.00"),
        ("accountants-and-auditors", "13-2011.00"),
    ]
    
    for slug, soc in test_codes:
        print(f"\nTesting {slug} ({soc})...")
        tasks = scrape_occupation_tasks(soc)
        print(f"  Found {len(tasks)} tasks")
        for t in tasks[:3]:
            print(f"    - {t['task_text'][:80]}...")
        time.sleep(1)
