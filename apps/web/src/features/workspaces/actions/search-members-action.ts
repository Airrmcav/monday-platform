"use server";

import { z } from "zod";

import { getUsers } from "@/features/users/services/users.service";

const searchMembersSchema = z.strictObject({
  search: z.string().trim().max(120).default(""),
  page: z.number().int().min(1).max(100000).default(1),
});

export type MemberOption = {
  id: string;
  name: string;
  email: string;
};

export type SearchMembersResult =
  | {
      status: "success";
      members: MemberOption[];
      pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    }
  | { status: "invalid" }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "unavailable" };

export async function searchMembersAction(input: {
  search?: string;
  page?: number;
}): Promise<SearchMembersResult> {
  const validation = searchMembersSchema.safeParse(input);

  if (!validation.success) {
    return { status: "invalid" };
  }

  const result = await getUsers({
    search: validation.data.search,
    page: validation.data.page,
    pageSize: 10,
    status: "ACTIVE",
  });

  if (result.status !== "success") {
    return { status: result.status };
  }

  return {
    status: "success",
    members: result.result.data.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
    })),
    pagination: result.result.pagination,
  };
}
