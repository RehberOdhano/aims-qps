-- Auditors can now hold multiple concurrent draft rounds (e.g. one per
-- department) and resume/finish each independently, rather than being
-- forced to finish or discard the current draft before starting another.
-- RLS policies already scope select/insert/update to auditor_id = auth.uid()
-- per row, not on a one-draft assumption, so no policy changes are needed.
drop index if exists rounds_one_draft_per_auditor;
