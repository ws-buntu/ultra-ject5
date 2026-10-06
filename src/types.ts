export interface Initiative {
  id: string;
  title: string;
  progress: number; // 0 to 100
  completed: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
  initiativeId?: string; // Associated Initiative ID
  weight?: number; // Weight percentage contribution to the Initiative's progress
}

export type ProjectCategory = 'Development' | 'Design' | 'Marketing' | 'Operations' | 'Finance';
export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ProjectActivity {
  id: string;
  timestamp: string; // ISO String
  type: 'status_change' | 'milestone_added' | 'milestone_completed' | 'milestone_incomplete' | 'milestone_deleted' | 'project_created' | 'project_edited' | 'time_logged';
  message: string;
  details?: string;
}

export interface ProjectGoal {
  id: string;
  text: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  owner: string;
  initiatives: Initiative[];
  milestones: Milestone[];
  color?: string; // Accent color identifier (e.g., 'white', 'amber', 'emerald', 'rose', 'blue', 'violet')
  history?: ProjectActivity[];
  notes?: string;
  quickNotes?: string;
  reminderDateTime?: string; // YYYY-MM-DDTHH:mm format
  reminderSent?: boolean;
  earlyWarningEnabled?: boolean; // Toggle early warning 24 hours before deadline
  earlyWarningSent?: boolean; // Whether the 24h early warning notification toast has triggered
  tags?: string[];
  goals?: (string | ProjectGoal)[];
  collaborators?: string[];
  pinned?: boolean;
}
