#!/usr/bin/env python3
"""
Import O*NET Abilities data (Importance + Level scales).
Abilities are cognitive/physical dimensions — critical for distinguishing
automatable cognitive-routine work from non-automatable physical work.

52 abilities across categories like:
  - Cognitive: Oral Comprehension, Written Expression, Number Facility, Perceptual Speed
  - Physical: Manual Dexterity, Static Strength, Stamina
  - Sensory: Near Vision, Speech Recognition
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from scripts.pipeline.import_onet_dimension import import_dimension

if __name__ == "__main__":
    import_dimension(
        excel_path='data/onet/Abilities.xlsx',
        table_name='onet_abilities',
        source_label='onet_abilities',
    )
