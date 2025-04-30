export interface User {
  id: string;
  email: string;
  full_name: string;
  status: 'active' | 'banned' | 'suspended';
  created_at: string;
  last_sign_in_at: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  seller: {
    full_name: string;
    email: string;
  };
  moderation_status: 'active' | 'suspended' | 'under_review';
  created_at: string;
}

export interface Report {
  id: string;
  reporter: {
    full_name: string;
    email: string;
  };
  product: {
    id: string;
    title: string;
    seller: {
      full_name: string;
      email: string;
    };
  };
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface Stats {
  users: number;
  products: number;
  chats: number;
  reports: number;
}

export interface Campus {
  id: string;
  name: string;
  location: string;
  created_at: string;
}
```