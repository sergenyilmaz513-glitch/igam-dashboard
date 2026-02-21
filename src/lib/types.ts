export interface TeamMember {
  id: number
  name: string
  avatar: string
  role: string
  color: string
  email: string
  expertise: string[]
}

export interface Project {
  id: number
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'done'
  members: number[]
  progress: number
  start_date: string
  end_date: string
  color: string
  created_at: string
}

export interface Task {
  id: number
  title: string
  assignee: number
  status: 'todo' | 'in-progress' | 'done'
  priority: 'high' | 'medium' | 'low'
  due_date: string
  category: string
  project_id: number
  created_at: string
}

export interface Document {
  id: number
  project_id: number
  name: string
  type: string
  category: string
  url: string
  uploaded_by: number
  created_at: string
}

export interface Event {
  id: number
  title: string
  event_date: string
  event_time: string
  type: 'meeting' | 'seminar' | 'deadline' | 'fieldwork'
  members: number[]
  color: string
  created_at: string
}

export interface Message {
  id: number
  sender: number
  text: string
  created_at: string
}
