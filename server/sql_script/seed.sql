BEGIN;

-- Development users
INSERT INTO users (
  id,
  first_name,
  last_name,
  email,
  password_hash,
  avatar_url
)
VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    'Amina',
    'Dlamini',
    'amina@example.test',
    crypt('DevPassword123!', gen_salt('bf', 12)),
    'https://i.pravatar.cc/150?img=47'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'Bernard',
    'Mokoana',
    'bernard@example.test',
    crypt('DevPassword123!', gen_salt('bf', 12)),
    'https://i.pravatar.cc/150?img=12'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'Lebo',
    'Ndlovu',
    'lebo@example.test',
    crypt('DevPassword123!', gen_salt('bf', 12)),
    'https://i.pravatar.cc/150?img=32'
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'Naledi',
    'Khumalo',
    'naledi@example.test',
    crypt('DevPassword123!', gen_salt('bf', 12)),
    'https://i.pravatar.cc/150?img=44'
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    'Thabo',
    'Mthembu',
    'thabo@example.test',
    crypt('DevPassword123!', gen_salt('bf', 12)),
    'https://i.pravatar.cc/150?img=68'
  )
ON CONFLICT (id) DO UPDATE
SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  avatar_url = EXCLUDED.avatar_url;

-- Development tasks
INSERT INTO tasks (
  id,
  title,
  task_type,
  xp_value
)
VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    'Welcome to the LMS',
    'lesson',
    50
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'JavaScript Foundations Quiz',
    'quiz',
    100
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'Build Your First API',
    'project',
    250
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    'Community Discussion',
    'discussion',
    50
  ),
  (
    '20000000-0000-4000-8000-000000000005',
    'Database Design Challenge',
    'challenge',
    150
  )
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  task_type = EXCLUDED.task_type,
  xp_value = EXCLUDED.xp_value;

-- Immutable XP event history
INSERT INTO leaderboard_events (
  id,
  user_id,
  task_id,
  xp_delta,
  event_type,
  reference_id,
  created_at
)
VALUES
  (
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    50,
    'task_completed',
    '40000000-0000-4000-8000-000000000001',
    '2026-10-06T08:00:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    100,
    'task_completed',
    '40000000-0000-4000-8000-000000000002',
    '2026-10-07T09:15:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000003',
    250,
    'task_completed',
    '40000000-0000-4000-8000-000000000003',
    '2026-10-10T13:30:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    50,
    'task_completed',
    '40000000-0000-4000-8000-000000000004',
    '2026-10-06T10:00:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    100,
    'task_completed',
    '40000000-0000-4000-8000-000000000005',
    '2026-10-08T11:00:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    50,
    'task_completed',
    '40000000-0000-4000-8000-000000000006',
    '2026-10-06T12:00:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000002',
    100,
    'task_completed',
    '40000000-0000-4000-8000-000000000007',
    '2026-10-08T14:30:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000004',
    50,
    'task_completed',
    '40000000-0000-4000-8000-000000000008',
    '2026-10-09T09:00:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000009',
    '10000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000002',
    100,
    'task_completed',
    '40000000-0000-4000-8000-000000000009',
    '2026-10-07T15:00:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000010',
    '10000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000003',
    250,
    'task_completed',
    '40000000-0000-4000-8000-000000000010',
    '2026-10-10T16:00:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000011',
    '10000000-0000-4000-8000-000000000005',
    '20000000-0000-4000-8000-000000000001',
    50,
    'task_completed',
    '40000000-0000-4000-8000-000000000011',
    '2026-10-06T13:00:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000012',
    '10000000-0000-4000-8000-000000000005',
    '20000000-0000-4000-8000-000000000002',
    100,
    'task_completed',
    '40000000-0000-4000-8000-000000000012',
    '2026-10-09T11:30:00Z'
  )
ON CONFLICT (id) DO UPDATE
SET
  user_id = EXCLUDED.user_id,
  task_id = EXCLUDED.task_id,
  xp_delta = EXCLUDED.xp_delta,
  event_type = EXCLUDED.event_type,
  reference_id = EXCLUDED.reference_id,
  created_at = EXCLUDED.created_at;

-- Recalculate the aggregate score table from event history.
INSERT INTO scores (
  user_id,
  total_xp,
  last_earned
)
SELECT
  users.id,
  COALESCE(SUM(leaderboard_events.xp_delta), 0),
  MAX(leaderboard_events.created_at)
FROM users
LEFT JOIN leaderboard_events
  ON leaderboard_events.user_id = users.id
WHERE users.id IN (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000005'
)
GROUP BY users.id
ON CONFLICT (user_id) DO UPDATE
SET
  total_xp = EXCLUDED.total_xp,
  last_earned = EXCLUDED.last_earned;

-- Example weekly snapshot.
WITH ranked_scores AS (
  SELECT
    user_id,
    total_xp,
    RANK() OVER (ORDER BY total_xp DESC) AS final_rank
  FROM scores
  WHERE user_id IN (
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000005'
  )
)
INSERT INTO leaderboard_snapshots (
  user_id,
  timeframe,
  period_key,
  xp_earned,
  final_rank,
  captured_at
)
SELECT
  user_id,
  'weekly',
  '2026-W41',
  total_xp,
  final_rank,
  '2026-10-11T23:59:59Z'
FROM ranked_scores
ON CONFLICT (user_id, timeframe, period_key) DO UPDATE
SET
  xp_earned = EXCLUDED.xp_earned,
  final_rank = EXCLUDED.final_rank,
  captured_at = EXCLUDED.captured_at;

COMMIT;