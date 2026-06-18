export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  created_at: string;
}

export interface Inquiry {
  id: number;
  product_id: number;
  customer_name: string;
  contact: string;
  message: string;
  created_at: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
}

export interface InquiryFormData {
  product_id: number;
  customer_name: string;
  contact: string;
  message: string;
}
