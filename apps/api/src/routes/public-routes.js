import { Router } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../services/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { serialize } from "../utils/serialize.js";

const router = Router();

router.get(
  "/track",
  asyncHandler(async (req, res) => {
    const token = req.query.token?.toString().trim();

    if (!token) {
      return res.status(400).json({ message: "Token de seguimiento requerido." });
    }

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Liga de seguimiento invalida o vencida." });
    }

    if (
      !payload ||
      typeof payload !== "object" ||
      payload.type !== "service-order-track" ||
      !payload.orderId ||
      !payload.tenantId
    ) {
      return res.status(401).json({ message: "Liga de seguimiento invalida." });
    }

    const order = await prisma.serviceOrder.findFirst({
      where: {
        id: payload.orderId,
        tenantId: payload.tenantId
      },
      include: {
        customer: {
          select: {
            fullName: true
          }
        },
        device: {
          select: {
            category: true,
            brand: true,
            model: true,
            accessories: true,
            issueSummary: true
          }
        },
        assignedUser: {
          select: {
            name: true
          }
        },
        tenant: {
          select: {
            name: true,
            brandProfile: {
              select: {
                companyName: true,
                supportEmail: true,
                ticketHeader: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada." });
    }

    return res.json(
      serialize({
        order: {
          folio: order.folio,
          status: order.status,
          priority: order.priority,
          failureReport: order.failureReport,
          diagnosis: order.diagnosis,
          promisedAt: order.promisedAt,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          customer: {
            fullName: order.customer.fullName
          },
          device: {
            category: order.device.category,
            brand: order.device.brand,
            model: order.device.model,
            accessories: order.device.accessories,
            issueSummary: order.device.issueSummary
          },
          assignedUser: order.assignedUser,
          tenant: {
            name: order.tenant.brandProfile?.companyName || order.tenant.name,
            supportEmail: order.tenant.brandProfile?.supportEmail || null,
            ticketHeader: order.tenant.brandProfile?.ticketHeader || null
          }
        }
      })
    );
  })
);

export default router;
