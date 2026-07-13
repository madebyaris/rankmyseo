import { writable, type Writable } from "svelte/store";
import type {
  RankMySeoClient,
  BlogPostDetail,
  CreateBlogPostClientInput,
} from "@rankmyseo/client";
import type {
  BlogPost,
  BlogPostStatus,
  KeywordIntent,
  UpdateBlogPostInput,
} from "@rankmyseo/core/schemas";
import { getRankMySeoContext } from "../context.js";

/**
 * Input for creating a post. Only `title` is required; meta fields are
 * auto-generated server-side when omitted.
 */
export interface NewBlogPost {
  title: string;
  slug?: string;
  content?: string;
  targetKeyword?: string;
  intent?: KeywordIntent;
  metaTitle?: string;
  metaDescription?: string;
  status?: BlogPostStatus;
}

export interface BlogStore {
  posts: Writable<BlogPost[]>;
  loading: Writable<boolean>;
  error: Writable<Error | null>;
  refresh: () => Promise<void>;
  createPost: (input: NewBlogPost) => Promise<BlogPost>;
  updatePost: (id: string, patch: UpdateBlogPostInput) => Promise<BlogPost>;
  deletePost: (id: string) => Promise<void>;
  getPost: (id: string) => Promise<BlogPostDetail>;
}

export function createBlogStore(client: RankMySeoClient): BlogStore {
  const posts = writable<BlogPost[]>([]);
  const loading = writable(true);
  const error = writable<Error | null>(null);

  async function refresh() {
    loading.set(true);
    error.set(null);
    try {
      posts.set(await client.blog.list());
    } catch (e) {
      error.set(e instanceof Error ? e : new Error(String(e)));
    } finally {
      loading.set(false);
    }
  }

  async function createPost(input: NewBlogPost) {
    const data = await client.blog.create(input as CreateBlogPostClientInput);
    await refresh();
    return data;
  }

  async function updatePost(id: string, patch: UpdateBlogPostInput) {
    const data = await client.blog.update(id, patch);
    await refresh();
    return data;
  }

  async function deletePost(id: string) {
    await client.blog.delete(id);
    await refresh();
  }

  async function getPost(id: string) {
    return client.blog.get(id);
  }

  void refresh();

  return {
    posts,
    loading,
    error,
    refresh,
    createPost,
    updatePost,
    deletePost,
    getPost,
  };
}

export function blogStore(): BlogStore {
  return createBlogStore(getRankMySeoContext());
}
