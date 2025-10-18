export type ActivityElementType = 'text' | 'image' | 'pdf' | 'video';

export interface ActivityElement {
  id: string;
  type: ActivityElementType;
  content: string; // text content or file URL
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  style: {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: string;
    padding?: string;
  };
  // File metadata (optional)
  fileId?: string;
  fileName?: string;
}

export interface ActivityLayout {
  elements: ActivityElement[];
}

export interface Activity {
  id: string;
  title: string;
  description: string | null;
  type: string;
  level: string;
  school_id: string;
  layout_data: ActivityLayout;
  is_published: boolean;
  created_at: string | null;
  updated_at: string | null;
}
