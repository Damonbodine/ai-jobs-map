#!/usr/bin/env python3
"""
Import O*NET Knowledge data (Importance + Level scales).
Knowledge areas predict tool applicability and digital readiness:
  - High "Computers and Electronics" = already works with structured data
  - High "Mathematics" = quantitative reasoning, model-friendly
  - High "English Language" = text-heavy work, NLP-applicable

33 knowledge domains including:
  Administration, Economics, Mathematics, Computers, Engineering, etc.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from scripts.pipeline.import_onet_dimension import import_dimension

if __name__ == "__main__":
    import_dimension(
        excel_path='data/onet/Knowledge.xlsx',
        table_name='onet_knowledge',
        source_label='onet_knowledge',
    )
