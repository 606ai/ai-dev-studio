import { Plugin, PluginMetadata, PluginContext } from '../PluginSystem';
import { EventEmitter } from 'events';

export interface ReviewComment {
  id: string;
  file: string;
  line: number;
  content: string;
  author: string;
  timestamp: Date;
  resolved: boolean;
  thread?: ReviewComment[];
}

export interface ReviewRequest {
  id: string;
  title: string;
  description: string;
  author: string;
  reviewers: string[];
  files: string[];
  status: 'open' | 'closed' | 'merged';
  comments: ReviewComment[];
  created: Date;
  updated: Date;
}

export interface AIReviewSuggestion {
  type: 'security' | 'performance' | 'style' | 'logic';
  file: string;
  line: number;
  suggestion: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
}

export class CodeReviewService {
  private reviews: Map<string, ReviewRequest> = new Map();
  private events: EventEmitter = new EventEmitter();

  async createReview(review: Omit<ReviewRequest, 'id' | 'created' | 'updated'>): Promise<ReviewRequest> {
    const id = Math.random().toString(36).substring(2);
    const newReview: ReviewRequest = {
      ...review,
      id,
      created: new Date(),
      updated: new Date(),
      comments: []
    };

    this.reviews.set(id, newReview);
    this.events.emit('reviewCreated', newReview);
    return newReview;
  }

  async getReview(id: string): Promise<ReviewRequest | undefined> {
    return this.reviews.get(id);
  }

  async updateReview(id: string, update: Partial<ReviewRequest>): Promise<ReviewRequest> {
    const review = this.reviews.get(id);
    if (!review) {
      throw new Error(`Review ${id} not found`);
    }

    const updatedReview = {
      ...review,
      ...update,
      updated: new Date()
    };

    this.reviews.set(id, updatedReview);
    this.events.emit('reviewUpdated', updatedReview);
    return updatedReview;
  }

  async addComment(reviewId: string, comment: Omit<ReviewComment, 'id'>): Promise<ReviewComment> {
    const review = this.reviews.get(reviewId);
    if (!review) {
      throw new Error(`Review ${reviewId} not found`);
    }

    const newComment: ReviewComment = {
      ...comment,
      id: Math.random().toString(36).substring(2)
    };

    review.comments.push(newComment);
    review.updated = new Date();
    this.events.emit('commentAdded', { reviewId, comment: newComment });
    return newComment;
  }

  async resolveComment(reviewId: string, commentId: string): Promise<void> {
    const review = this.reviews.get(reviewId);
    if (!review) {
      throw new Error(`Review ${reviewId} not found`);
    }

    const comment = review.comments.find(c => c.id === commentId);
    if (!comment) {
      throw new Error(`Comment ${commentId} not found`);
    }

    comment.resolved = true;
    review.updated = new Date();
    this.events.emit('commentResolved', { reviewId, commentId });
  }

  async getAIReviewSuggestions(files: string[]): Promise<AIReviewSuggestion[]> {
    // This would integrate with the AI service to get automated review suggestions
    // For now, returning a mock suggestion
    return [{
      type: 'security',
      file: files[0],
      line: 1,
      suggestion: 'Consider adding input validation',
      confidence: 0.85,
      severity: 'medium'
    }];
  }

  onReviewCreated(handler: (review: ReviewRequest) => void): void {
    this.events.on('reviewCreated', handler);
  }

  onReviewUpdated(handler: (review: ReviewRequest) => void): void {
    this.events.on('reviewUpdated', handler);
  }

  onCommentAdded(handler: (data: { reviewId: string; comment: ReviewComment }) => void): void {
    this.events.on('commentAdded', handler);
  }

  onCommentResolved(handler: (data: { reviewId: string; commentId: string }) => void): void {
    this.events.on('commentResolved', handler);
  }
}

export class CodeReviewPlugin implements Plugin {
  metadata: PluginMetadata = {
    id: 'code-review',
    name: 'Code Review',
    version: '1.0.0',
    description: 'Provides collaborative code review features with AI assistance',
    author: 'AI Dev Studio'
  };

  private context!: PluginContext;
  private reviewService!: CodeReviewService;

  async activate(context: PluginContext): Promise<void> {
    this.context = context;
    this.reviewService = new CodeReviewService();

    // Register the review service
    context.services['codeReview'] = this.reviewService;

    // Register commands
    this.registerCommands();

    // Register views
    this.registerViews();

    // Register editor decorations
    this.registerEditorDecorations();
  }

  private registerCommands(): void {
    const commands = {
      'review.create': async (params: {
        title: string;
        description: string;
        files: string[];
        reviewers: string[];
      }) => {
        const review = await this.reviewService.createReview({
          ...params,
          author: 'current-user',
          status: 'open',
          comments: []
        });
        return review;
      },
      'review.addComment': async (params: {
        reviewId: string;
        file: string;
        line: number;
        content: string;
      }) => {
        const comment = await this.reviewService.addComment(params.reviewId, {
          file: params.file,
          line: params.line,
          content: params.content,
          author: 'current-user',
          timestamp: new Date(),
          resolved: false
        });
        return comment;
      },
      'review.resolveComment': async (params: {
        reviewId: string;
        commentId: string;
      }) => {
        await this.reviewService.resolveComment(params.reviewId, params.commentId);
      },
      'review.getAISuggestions': async (files: string[]) => {
        const suggestions = await this.reviewService.getAIReviewSuggestions(files);
        return suggestions;
      }
    };

    Object.entries(commands).forEach(([id, handler]) => {
      this.context.events.emit('commands:register', { id, handler });
    });
  }

  private registerViews(): void {
    // Register review explorer
    this.context.events.emit('views:register', {
      id: 'review-explorer',
      title: 'Code Reviews',
      component: 'ReviewExplorer',
      icon: 'git-pull-request'
    });

    // Register review details view
    this.context.events.emit('views:register', {
      id: 'review-details',
      title: 'Review Details',
      component: 'ReviewDetails',
      icon: 'comment-discussion'
    });

    // Register AI suggestions view
    this.context.events.emit('views:register', {
      id: 'ai-suggestions',
      title: 'AI Review Suggestions',
      component: 'AISuggestions',
      icon: 'lightbulb'
    });
  }

  private registerEditorDecorations(): void {
    this.context.events.emit('editor:registerDecoration', {
      id: 'review-comment',
      render: (line: number, file: string) => ({
        before: {
          contentText: '💬',
          color: '#2196F3'
        }
      })
    });

    this.context.events.emit('editor:registerDecoration', {
      id: 'ai-suggestion',
      render: (line: number, file: string) => ({
        before: {
          contentText: '🤖',
          color: '#4CAF50'
        }
      })
    });
  }

  async deactivate(): Promise<void> {
    // Cleanup
  }
}

export default CodeReviewPlugin;
