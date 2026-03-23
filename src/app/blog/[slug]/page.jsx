import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Hash, Calendar, Eye } from 'lucide-react';

async function getPost(slug) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return null;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data } = await supabase
      .from('blog_posts')
      .select('*, categories(name, slug, color)')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    return data;
  } catch (err) {
    console.error('Fetch post error:', err);
    return null;
  }
}

function readingTime(content) {
  const wordCount = content?.replace(/<[^>]*>/g, '').split(/\s+/).length || 0;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  return {
    title: post ? `${post.title} | EmberOS Journal` : 'Article | EmberOS',
    description: post?.excerpt || 'Journal entry on EmberOS portfolio.',
    openGraph: post?.cover_image ? { images: [{ url: post.cover_image }] } : {},
  };
}

export const dynamic = 'force-dynamic'; // Always fetch latest content

export default async function BlogArticle({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return notFound();

  const rt = readingTime(post.content || '');

  return (
    <div className="min-h-screen w-full">
      {/* Hero Cover */}
      {post.cover_image && (
        <div className="relative w-full h-[45vh] overflow-hidden">
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/40 to-bg" />
        </div>
      )}

      <div className="pt-16 pb-32 px-6 md:px-12 max-w-3xl mx-auto w-full">
        {/* Back button */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-text-muted hover:text-accent transition-colors mb-10 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono text-sm uppercase tracking-wider">Back to Journal</span>
        </Link>

        {/* Meta */}
        <div className="flex items-center flex-wrap gap-3 mb-6">
          {post.categories && (
            <span className="flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-full" style={{ color: post.categories.color, backgroundColor: `${post.categories.color}15`, border: `1px solid ${post.categories.color}30` }}>
              <Hash className="w-3 h-3" />{post.categories.name}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
            <Calendar className="w-3 h-3" />
            {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
            <Clock className="w-3 h-3" />{rt} min read
          </span>
          {post.views > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
              <Eye className="w-3 h-3" />{post.views} views
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-display font-black text-text uppercase tracking-tighter mb-6 leading-none">
          {post.title}
        </h1>

        {/* Excerpt highlight */}
        {post.excerpt && (
          <p className="text-xl text-text-muted leading-relaxed mb-10 border-l-4 border-accent pl-5 italic">
            {post.excerpt}
          </p>
        )}

        {/* Tags */}
        {(post.tags || []).length > 0 && (
          <div className="flex gap-2 flex-wrap mb-12">
            {post.tags.map(tag => (
              <span key={tag} className="text-xs font-mono text-text-muted px-3 py-1 rounded-full border border-muted/20">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-muted/20 mb-12" />

        {/* Article Body */}
        <article
          className="prose prose-invert prose-orange max-w-none
            prose-h1:font-display prose-h1:font-black prose-h1:text-text prose-h1:tracking-tight
            prose-h2:font-display prose-h2:font-bold prose-h2:text-text prose-h2:border-b prose-h2:border-muted/20 prose-h2:pb-3
            prose-h3:font-display prose-h3:font-semibold prose-h3:text-text
            prose-p:text-text-muted prose-p:leading-relaxed prose-p:text-lg
            prose-a:text-accent prose-a:no-underline hover:prose-a:underline
            prose-code:text-accent prose-code:bg-surface/40 prose-code:rounded prose-code:px-1 prose-code:text-sm
            prose-pre:bg-bg prose-pre:border prose-pre:border-muted/20 prose-pre:rounded-2xl
            prose-blockquote:border-accent prose-blockquote:text-text-muted prose-blockquote:bg-accent/5 prose-blockquote:rounded-r-xl prose-blockquote:py-2
            prose-strong:text-text prose-img:rounded-2xl prose-img:border prose-img:border-muted/20
            prose-table:w-full prose-th:text-accent prose-th:font-mono prose-td:text-text-muted"
          dangerouslySetInnerHTML={{ __html: post.content || '<p>Content coming soon.</p>' }}
        />

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-muted/20 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-2 text-text-muted hover:text-accent text-sm font-mono uppercase tracking-wider group transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> All articles
          </Link>
          <Link href="/contact" className="text-accent hover:text-accent-hover text-sm font-mono uppercase tracking-wider transition-colors">
            Get in touch →
          </Link>
        </div>
      </div>
    </div>
  );
}
