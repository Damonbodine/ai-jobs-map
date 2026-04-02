# Occupation Coverage Audit

## Summary

- Total occupations: 826
- Story-ready occupations: 652
- Thin occupations: 581
- Missing profile rows: 0
- Missing time ranges: 71
- Missing block ranges: 79
- Missing blockers: 514
- Too few tasks: 54
- Too few AI tasks: 87
- Too few categorized AI tasks: 71
- No generated opportunities: 626
- No approved opportunities: 826

## Highest-priority thin occupations

| Occupation | Category | Severity | Reasons |
| --- | --- | ---: | --- |
| Food processing workers all other | Production | 17 | missing_time_range, missing_block_ranges, missing_blockers, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Installation maintenance and repair workers all other | Installation Maintenance and Repair | 17 | missing_time_range, missing_block_ranges, missing_blockers, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Media and communication equipment workers all other | Arts Design Entertainment Sports and Media | 17 | missing_time_range, missing_block_ranges, missing_blockers, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Production workers all other | Production | 17 | missing_time_range, missing_block_ranges, missing_blockers, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Social workers all other | Community and Social Service | 17 | missing_time_range, missing_block_ranges, missing_blockers, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Woodworkers all other | Production | 17 | missing_time_range, missing_block_ranges, missing_blockers, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Computer occupations all other | Computer and Mathematical | 16 | missing_time_range, missing_block_ranges, missing_blockers, too_few_tasks, too_few_ai_tasks |
| Electrical and electronics repairers commercial and industrial equipment | Installation Maintenance and Repair | 15 | missing_blockers, too_few_tasks, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Kindergarten teachers except special education | Educational Instruction and Library | 15 | missing_blockers, too_few_tasks, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Bakers | Production | 13 | too_few_tasks, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Bartenders | Food Preparation and Serving | 13 | too_few_tasks, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Camera and photographic equipment repairers | Installation Maintenance and Repair | 13 | too_few_tasks, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Dental laboratory technicians | Production | 13 | too_few_tasks, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Extruding and drawing machine setters operators and tenders metal and plastic | Production | 13 | too_few_tasks, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Home appliance repairers | Installation Maintenance and Repair | 13 | too_few_tasks, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Industrial truck and tractor operators | Transportation and Material Moving | 13 | too_few_tasks, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Medical equipment preparers | Healthcare Support | 13 | too_few_tasks, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Metal-refining furnace operators and tenders | Production | 13 | too_few_tasks, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Motion picture projectionists | Personal Care and Service | 13 | too_few_tasks, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Paperhangers | Construction and Extraction | 13 | too_few_tasks, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Phlebotomists | Healthcare Support | 13 | too_few_tasks, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Tire builders | Production | 13 | too_few_tasks, too_few_ai_tasks, too_few_categorized_ai_tasks |
|  Fabric and apparel patternmakers | Production | 11 | missing_blockers, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Camera operators television video and film | Arts Design Entertainment Sports and Media | 11 | missing_blockers, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Cashiers | Sales and Related | 11 | missing_blockers, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Childcare workers | Personal Care and Service | 11 | missing_blockers, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Coaches and scouts | Arts Design Entertainment Sports and Media | 11 | missing_blockers, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Correspondence clerks | Office and Administrative Support | 11 | missing_blockers, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Electrical and electronics installers and repairers transportation equipment | Installation Maintenance and Repair | 11 | missing_blockers, too_few_ai_tasks, too_few_categorized_ai_tasks |
| Emergency management directors | Management | 11 | missing_blockers, too_few_ai_tasks, too_few_categorized_ai_tasks |

## Backfill order

1. Regenerate or enrich `job_micro_tasks` for occupations with `too_few_ai_tasks` or `too_few_categorized_ai_tasks`.
2. Recompute `occupation_automation_profile` for occupations missing `time_range_*`, `time_range_by_block`, or blockers.
3. Generate `ai_opportunities` where none exist, then decide whether to bulk-approve or selectively approve.
4. Add curated overrides only after the structured backfill is in place.

## Reference case

- `air-traffic-controllers`: missing_blockers, no_generated_opportunities, no_approved_opportunities
