-- Create prompts table for AI prompt management
CREATE TABLE IF NOT EXISTS prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  system_prompt TEXT NOT NULL,
  is_active INTEGER DEFAULT 0,
  is_default INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default prompts
INSERT OR IGNORE INTO prompts (name, description, system_prompt, is_active, is_default) VALUES
('Default Assistant', 'General purpose development assistant', 'You are a helpful development assistant. Provide clear, concise, and accurate responses. Focus on practical solutions and best practices.', 1, 1),
('Code Reviewer', 'Focused on code review and quality', 'You are an expert code reviewer. Analyze code for bugs, performance issues, security vulnerabilities, and adherence to best practices. Provide constructive feedback.', 0, 0),
('Technical Writer', 'Documentation and explanation specialist', 'You are a technical writer. Explain complex technical concepts clearly and concisely. Create well-structured documentation with examples.', 0, 0);
