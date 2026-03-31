#!/usr/bin/env python3
"""
Import O*NET Work Activities data (Importance + Level scales).
Work Activities are General Work Activities (GWAs) — broader than tasks or DWAs.

~41 GWAs map directly to automation categories:
  - Highly automatable: "Processing Information", "Documenting/Recording Information",
    "Analyzing Data", "Getting Information"
  - Moderately automatable: "Communicating with Supervisors", "Scheduling Work",
    "Organizing, Planning, and Prioritizing Work"
  - Low automation: "Performing for or Working Directly with the Public",
    "Assisting and Caring for Others", "Handling and Moving Objects"
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from scripts.pipeline.import_onet_dimension import import_dimension

if __name__ == "__main__":
    import_dimension(
        excel_path='data/onet/Work_Activities.xlsx',
        table_name='onet_work_activities',
        source_label='onet_work_activities',
    )
