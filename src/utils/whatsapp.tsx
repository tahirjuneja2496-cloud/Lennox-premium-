import React from 'react';
import { Order, OrderStatus } from '../types';

/**
 * Normalizes phone numbers for WhatsApp click-to-chat URL.
 * Automatically adds the +91 country code for 10-digit Indian numbers
 * without duplicating if country code is already present.
 */
export function formatWhatsAppNumber(phone: string | undefined | null): string {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^0-9]/g, '');
  if (!cleaned) return '';

  // Remove leading international access prefix 0091
  if (cleaned.startsWith('0091')) {
    cleaned = cleaned.slice(2);
  }

  // Remove leading single 0 (trunk prefix) if followed by 10 digits
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  // 10-digit Indian mobile number -> prepend 91
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }

  return cleaned;
}

/**
 * Returns the status icon, display title, and message text matching the admin status.
 */
export function getWhatsAppStatusInfo(status: OrderStatus | string): {
  icon: string;
  statusTitle: string;
  messageText: string;
} {
  switch (status) {
    case 'Confirmed':
      return {
        icon: '✅',
        statusTitle: 'Confirmed',
        messageText: 'Your order has been successfully confirmed.'
      };
    case 'Processing':
    case 'Packed':
      return {
        icon: '🔄',
        statusTitle: status === 'Packed' ? 'Packed' : 'Processing',
        messageText: 'Your order is currently being prepared.'
      };
    case 'Shipped':
      return {
        icon: '🚚',
        statusTitle: 'Shipped',
        messageText: 'Your order has been shipped and is on its way to you.'
      };
    case 'Delivered':
      return {
        icon: '🎉',
        statusTitle: 'Delivered',
        messageText: 'Your order has been successfully delivered.'
      };
    case 'Cancelled':
      return {
        icon: '❌',
        statusTitle: 'Cancelled',
        messageText: 'Unfortunately, your order has been cancelled.'
      };
    case 'Refunded':
      return {
        icon: '↩️',
        statusTitle: 'Refunded',
        messageText: 'Your order has been processed for refund.'
      };
    case 'Pending':
    default:
      return {
        icon: '⏳',
        statusTitle: 'Pending',
        messageText: 'Your order has been received and is waiting for confirmation.'
      };
  }
}

/**
 * Dynamically builds the pre-filled message text from current order details & active status.
 */
export function generateWhatsAppMessage({
  order,
  status,
  storeName = 'Atelier V',
  formattedTotal
}: {
  order: Order;
  status?: OrderStatus | string;
  storeName?: string;
  formattedTotal?: string;
}): string {
  const currentStatus = status || order.status || 'Pending';
  const { icon, statusTitle, messageText } = getWhatsAppStatusInfo(currentStatus);
  const customerName = order.customer?.fullName?.trim() || 'Valued Patron';

  const lines: string[] = [
    `Hello ${customerName} 👋`,
    '',
    `Thank you for your order with ${storeName} ❤️`,
    '',
    `🆔 Order ID: ${order.id}`
  ];

  // Optional customer ID if present on record (do not invent fake ID)
  if ((order.customer as any)?.id) {
    lines.push(`👤 Customer ID: ${(order.customer as any).id}`);
  }

  // Product(s) list
  if (Array.isArray(order.items) && order.items.length > 0) {
    if (order.items.length === 1) {
      const it = order.items[0];
      const vDetail = it.color && it.size ? ` (${it.color} / ${it.size})` : (it.color ? ` (${it.color})` : (it.size ? ` (${it.size})` : (it.variantName ? ` (${it.variantName})` : '')));
      const qtyStr = it.quantity > 1 ? ` (×${it.quantity})` : '';
      lines.push(`📦 Product: ${it.productName}${vDetail}${qtyStr}`);
    } else {
      const prodList = order.items
        .map((it) => {
          const vDetail = it.color && it.size ? ` (${it.color} / ${it.size})` : (it.color ? ` (${it.color})` : (it.size ? ` (${it.size})` : (it.variantName ? ` (${it.variantName})` : '')));
          return `${it.productName}${vDetail}${it.quantity > 1 ? ` (×${it.quantity})` : ''}`;
        })
        .join(', ');
      lines.push(`📦 Products: ${prodList}`);
    }
  }

  // Total amount
  const total =
    formattedTotal ||
    (order.pricing?.grandTotal !== undefined
      ? `₹${order.pricing.grandTotal.toLocaleString('en-IN')}`
      : '');
  if (total) {
    lines.push(`💰 Total: ${total}`);
  }

  // Status block
  lines.push(`${icon} Order Status: ${statusTitle}`);
  lines.push('');
  lines.push(messageText);
  lines.push('');
  lines.push('Thank you for shopping with us! 🙏');

  return lines.join('\n');
}

/**
 * Generates the standard WhatsApp click-to-chat URL:
 * https://wa.me/<number>?text=<encoded_text>
 */
export function getWhatsAppClickToChatUrl({
  phone,
  text
}: {
  phone: string | undefined | null;
  text: string;
}): string {
  const formattedPhone = formatWhatsAppNumber(phone);
  const encodedText = encodeURIComponent(text);
  if (formattedPhone) {
    return `https://wa.me/${formattedPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

/**
 * Inline WhatsApp Icon SVG
 */
export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
