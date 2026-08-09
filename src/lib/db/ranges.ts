// src/lib/ranges.ts

import { nhost } from "./client";

export interface Range {
  id: string;
  start: string;
  end: string;
  color: string;
  label: string;
  owner_id: string;
}

export interface NewRange {
  start: string;
  end: string;
  color: string;
  label: string;
  owner_id: string;
}

export interface UpdateRange {
  start?: string;
  end?: string;
  color?: string;
  label?: string;
}

interface GetRangesResponse {
  ranges: Range[];
}

interface GetRangeResponse {
  ranges_by_pk: Range | null;
}

interface CreateRangeResponse {
  insert_ranges_one: Range;
}

interface UpdateRangeResponse {
  update_ranges_by_pk: {
    id: string;
    start: string;
    end: string;
    color: string;
    label: string;
    owner_id: string;
  } | null;
}

interface DeleteRangeResponse {
  delete_ranges_by_pk: {
    id: string;
  } | null;
}

/**
 * Get all ranges belonging to an owner.
 */
export async function getRanges(ownerId: string): Promise<Range[]> {
  const response = await nhost.graphql.request<GetRangesResponse>({
    query: `
      query GetRanges($ownerId: uuid!) {
        ranges(
          where: { owner_id: { _eq: $ownerId } }
          order_by: { start: asc }
        ) {
          id
          start
          end
          color
          label
          owner_id
        }
      }
    `,
    variables: {
      ownerId,
    },
  });

  return response.body.data?.ranges ?? [];
}

/**
 * Get a single range by ID.
 */
export async function getRange(id: string): Promise<Range | null> {
  const response = await nhost.graphql.request<GetRangeResponse>({
    query: `
      query GetRange($id: uuid!) {
        ranges_by_pk(id: $id) {
          id
          start
          end
          color
          label
          owner_id
        }
      }
    `,
    variables: {
      id,
    },
  });

  return response.body.data?.ranges_by_pk ?? null;
}

/**
 * Create a new range.
 */
export async function createRange(newRange: NewRange): Promise<Range> {
  const response = await nhost.graphql.request<CreateRangeResponse>({
    query: `
      mutation CreateRange($range: ranges_insert_input!) {
        insert_ranges_one(object: $range) {
          id
          start
          end
          color
          label
          owner_id
        }
      }
    `,
    variables: {
      range: newRange,
    },
  });

  return response.body.data!.insert_ranges_one;
}

/**
 * Update an existing range.
 */
export async function updateRange(
  id: string,
  changes: UpdateRange,
): Promise<Range | null> {
  const response = await nhost.graphql.request<UpdateRangeResponse>({
    query: `
      mutation UpdateRange(
        $id: uuid!
        $changes: ranges_set_input!
      ) {
        update_ranges_by_pk(
          pk_columns: { id: $id }
          _set: $changes
        ) {
          id
          start
          end
          color
          label
          owner_id
        }
      }
    `,
    variables: {
      id,
      changes,
    },
  });

  return response.body.data?.update_ranges_by_pk ?? null;
}

/**
 * Delete a range.
 */
export async function deleteRange(id: string): Promise<string | null> {
  const response = await nhost.graphql.request<DeleteRangeResponse>({
    query: `
      mutation DeleteRange($id: uuid!) {
        delete_ranges_by_pk(id: $id) {
          id
        }
      }
    `,
    variables: {
      id,
    },
  });

  return response.body.data?.delete_ranges_by_pk?.id ?? null;
}
