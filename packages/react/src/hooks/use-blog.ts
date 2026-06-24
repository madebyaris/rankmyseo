import { useCallback, useEffect, useState } from "react";
import type {
  BlogPost,
  BlogPostStatus,
  KeywordIntent,
  Recommendation,
  UpdateBlogPostInput,
} from "@rankmyseo/core";
import { useRankMySeoClient } from "../client.js";

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
  const { api } = useRankMySeoClient();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ data: BlogPost[] }>("/blog");
      setPosts(res.data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createPost = useCallback(
    async (input: NewBlogPost) => {
      const res = await api<{ data: BlogPost }>("/blog", {
        method: "POST",
        body: JSON.stringify(input),
      });
      await refresh();
      return res.data;
    },
    [api, refresh],
  );

  const updatePost = useCallback(
    async (id: string, patch: UpdateBlogPostInput) => {
      const res = await api<{ data: BlogPost }>(`/blog/${id}`, {
        method: "PUT",
        body: JSON.stringify(patch),
      });
      await refresh();
      return res.data;
    },
    [api, refresh],
  );

  const deletePost = useCallback(
    async (id: string) => {
      await api(`/blog/${id}`, { method: "DELETE" });
      await refresh();
    },
    [api, refresh],
  );

  const getPost = useCallback(
    async (id: string) => {
      return api<{ data: BlogPost; recommendations: Recommendation[] }>(
        `/blog/${id}`,
      );
    },
    [api],
  );

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
