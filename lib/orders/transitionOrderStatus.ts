import { OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

interface TransitionOrderStatusInput {
  orderId: string;
  to: OrderStatus;
}

// Single choke point for Order.status changes — per docs/data-model.md,
// SLA-deadline and AdminAlert side effects must live here, not be set
// directly wherever a caller happens to change status.
export async function transitionOrderStatus({
  orderId,
  to,
}: TransitionOrderStatusInput) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id: orderId },
      data: { status: to, ...timestampFieldFor(to) },
    });

    // TODO(Phase 4 — docs/roadmap.md): wire in AdminAlert triggers
    // (unassigned_timeout, sla_breach_risk, no_supplier_available) and the
    // SupplierContract.achievedValue update on received/auto-confirmed here.

    return order;
  });
}

function timestampFieldFor(status: OrderStatus) {
  const now = new Date();
  switch (status) {
    case "assigned":
      return { assignedAt: now };
    case "delivered":
      return { deliveredAt: now };
    case "received":
      return { receivedConfirmedAt: now };
    default:
      return {};
  }
}
