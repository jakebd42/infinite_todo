-- Run this SQL in Supabase: Dashboard > SQL Editor > New Query

-- Create requests table
CREATE TABLE requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  notes TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('transit', 'safety', 'beautification', 'accessibility', 'other')),
  urgency TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Requests policies: anyone can read, authenticated users can insert their own
CREATE POLICY "Anyone can view requests"
  ON requests FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert requests"
  ON requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Votes policies: anyone can read, authenticated users can manage their own
CREATE POLICY "Anyone can view votes"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert votes"
  ON votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON votes FOR DELETE
  USING (auth.uid() = user_id);
