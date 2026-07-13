import { onMounted, ref } from "vue";
import type {
  BlogPost,
  BlogPostStatus,
  KeywordIntent,
  UpdateBlogPostInput,
} from "@rankmyseo/core/schemas";
import type { BlogPostDetail } from "@rankmyseo/client";
import { useRankMySeoClient } from "../plugin.js";

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

export function useBlog() {
  const client = useRankMySeoClient();
  const posts = ref<BlogPost[]>([]);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  async function refresh() {
    loading.value = true;
    error.value = null;
    try {
      posts.value = await client.blog.list();
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
    } finally {
      loading.value = false;
    }
  }

  async function createPost(input: NewBlogPost) {
    const data = await client.blog.create(input);
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

  async function getPost(id: string): Promise<BlogPostDetail> {
    return client.blog.get(id);
  }

  onMounted(() => {
    void refresh();
  });

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
