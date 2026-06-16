export type TaskStatus = 'new' | 'in_progress' | 'completed';

export type Task = {
  id: string;

  title: string;
  description?: string;

  dealId?: string;

  assigneeId: string;

  status: TaskStatus;

  dueDate?: string;

  createdAt: string;
  createdBy: string;
};

export type CreateTaskPayload = {
  title: string;
  description?: string;
  dealId?: string;
  assigneeId: string;
  dueDate?: string;
};

export type UpdateTaskPayload = {
  title?: string;
  description?: string;
  dealId?: string;
  status?: TaskStatus;
  dueDate?: string;
  assigneeId?: string;
};
