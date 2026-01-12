export interface CartItemDto {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineAmount: number;
}

export interface CartSummaryDto {
  customerId: string;
  items: CartItemDto[];
  totalAmount: number;
}
