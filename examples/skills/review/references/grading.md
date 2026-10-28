# PR grade

`scripts/grade.mjs` sets the grade from the file list, with the rules in `grading.json`. The same files always get the same grade. Change the paths in `grading.json` to match your repo.

| Grade | When | What happens |
|---|---|---|
| **Critical** | Any file matches `critical` (migrations, persistence, database, auth, payments, core domain) | Human gate, mandatory |
| **Large** | More than 15 files, or more than one project, or a file matches `businessLogic` | Needs a human |
| **Medium** | More than 5 files, no business logic | Machine review is enough |
| **Small** | 5 files or fewer, no business logic | Auto-merge when all checks pass |

The script grades only the file list. In step 6 of the review, raise the grade if the review found business logic, a data change or a security finding that the paths didn't show. Never lower it.

Always one line with the reason: the rule and the file that set the grade.

Test folders are not in `projects`, so a change to `src/` with its tests is still one project.
