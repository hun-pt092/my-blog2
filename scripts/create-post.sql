USE blog;

-- Create a sample post for testing
INSERT INTO posts (title, slug, content, excerpt, date) 
VALUES (
  'Hệ Phân Tán - Distributed Systems',
  'he-phan-tan',
  'Hệ phân tán (Distributed Systems) là một tập hợp các máy tính độc lập hoạt động như một hệ thống thống nhất. Bài viết này sẽ giới thiệu các khái niệm cơ bản về hệ phân tán...',
  'Tìm hiểu về hệ phân tán và các khái niệm cơ bản',
  NOW()
) ON CONFLICT (slug) DO NOTHING;
