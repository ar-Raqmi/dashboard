// Auto-generated stub - will be overwritten by `npx convex dev`
import type { DocumentByName, TableNamesInDataModel } from "convex/server";
export type DataModel = {
  users: {
    document: {
      _id: string;
      _creationTime: number;
      username: string;
      passwordHash: string;
      salt: string;
      createdAt: number;
    };
    fieldPaths: "username" | "passwordHash" | "salt" | "createdAt";
  };
  sessions: {
    document: {
      _id: string;
      _creationTime: number;
      userId: string;
      token: string;
      expiresAt: number;
      createdAt: number;
    };
    fieldPaths: "userId" | "token" | "expiresAt" | "createdAt";
  };
  tasks: {
    document: {
      _id: string;
      _creationTime: number;
      userId: string;
      title: string;
      dueDate?: string;
      priority: string;
      status: string;
      createdAt: string;
    };
    fieldPaths: "userId" | "title" | "dueDate" | "priority" | "status" | "createdAt";
  };
  goals: {
    document: {
      _id: string;
      _creationTime: number;
      userId: string;
      title: string;
      progress: number;
      createdAt: string;
    };
    fieldPaths: "userId" | "title" | "progress" | "createdAt";
  };
  milestones: {
    document: {
      _id: string;
      _creationTime: number;
      goalId: string;
      label: string;
      completed: boolean;
      order: number;
    };
    fieldPaths: "goalId" | "label" | "completed" | "order";
  };
  notes: {
    document: {
      _id: string;
      _creationTime: number;
      userId: string;
      title: string;
      content: string;
      color: string;
      pinned: boolean;
      createdAt: string;
      updatedAt: string;
    };
    fieldPaths: "userId" | "title" | "content" | "color" | "pinned" | "createdAt" | "updatedAt";
  };
  events: {
    document: {
      _id: string;
      _creationTime: number;
      userId: string;
      title: string;
      date: string;
      color?: string;
    };
    fieldPaths: "userId" | "title" | "date" | "color";
  };
  files: {
    document: {
      _id: string;
      _creationTime: number;
      userId: string;
      name: string;
      type: string;
      category: string;
      parentId?: string;
      size: number;
      createdAt: string;
      updatedAt: string;
      content?: string;
    };
    fieldPaths: "userId" | "name" | "type" | "category" | "parentId" | "size" | "createdAt" | "updatedAt" | "content";
  };
  clocks: {
    document: {
      _id: string;
      _creationTime: number;
      userId: string;
      label: string;
      timezone: string;
    };
    fieldPaths: "userId" | "label" | "timezone";
  };
  dashboardWidgets: {
    document: {
      _id: string;
      _creationTime: number;
      userId: string;
      type: string;
      label: string;
      icon: string;
      visible: boolean;
    };
    fieldPaths: "userId" | "type" | "label" | "icon" | "visible";
  };
  dashboardLayouts: {
    document: {
      _id: string;
      _creationTime: number;
      userId: string;
      layoutType: string;
      layouts: string;
    };
    fieldPaths: "userId" | "layoutType" | "layouts";
  };
  userSettings: {
    document: {
      _id: string;
      _creationTime: number;
      userId: string;
      profileName: string;
      profilePicture?: string;
      appTitle: string;
      appLogo?: string;
      iconBackgroundColor: string;
      hijriVisible: boolean;
      hijriOffset: number;
      showSeconds: boolean;
      clipboardText: string;
      backgroundType: string;
      backgroundColor: string;
      backgroundGradient: string;
      backgroundImage: string;
      backgroundOpacity: number;
    };
    fieldPaths: "userId" | "profileName" | "profilePicture" | "appTitle" | "appLogo" | "iconBackgroundColor" | "hijriVisible" | "hijriOffset" | "showSeconds" | "clipboardText" | "backgroundType" | "backgroundColor" | "backgroundGradient" | "backgroundImage" | "backgroundOpacity";
  };
};
export type TableNames = keyof DataModel;
export type DocumentByName<T extends TableNames> = DataModel[T]["document"];
