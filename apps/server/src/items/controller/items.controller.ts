import { t } from "elysia";
import { createController } from "@/shared/infra/base.controller";
import { createItem } from "../applications/create-item.usecase";
import { listItems } from "../applications/list-items.usecase";
import { getItem } from "../applications/get-item.usecase";
import { updateItem } from "../applications/update-item.usecase";
import { deleteItem } from "../applications/delete-item.usecase";

export const itemsController = createController({ prefix: "/items" })
  .get("/", async () => {
    const items = await listItems();
    return { data: items };
  }, {
    detail: { tags: ["Items"], summary: "List all items" },
  })
  .get("/:id", async ({ params }) => {
    const item = await getItem(params.id);
    return { data: item };
  }, {
    params: t.Object({ id: t.String() }),
    detail: { tags: ["Items"], summary: "Get item by ID" },
  })
  .post("/", async ({ body }) => {
    const item = await createItem(body);
    return { data: item };
  }, {
    body: t.Object({
      name: t.String({ minLength: 1 }),
      description: t.Optional(t.String()),
    }),
    detail: { tags: ["Items"], summary: "Create a new item" },
  })
  .put("/:id", async ({ params, body }) => {
    const item = await updateItem(params.id, body);
    return { data: item };
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({
      name: t.Optional(t.String({ minLength: 1 })),
      description: t.Optional(t.String()),
    }),
    detail: { tags: ["Items"], summary: "Update an item" },
  })
  .delete("/:id", async ({ params }) => {
    await deleteItem(params.id);
    return { message: "Item deleted" };
  }, {
    params: t.Object({ id: t.String() }),
    detail: { tags: ["Items"], summary: "Delete an item" },
  });
