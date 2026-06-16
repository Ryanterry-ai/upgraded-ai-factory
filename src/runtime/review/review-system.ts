// Phase 7: Review & Approval System

import {
  ReviewType,
  ReviewDecision,
  ApprovalRequest,
  ApprovalLevel,
  AgentArtifact,
  createApprovalRequest
} from '../state/agent-state.js';

export interface Reviewer {
  id: string;
  name: string;
  types: ReviewType[];
  autoApprove: boolean;
}

export interface ReviewResult {
  artifactId: string;
  decisions: ReviewDecision[];
  approved: boolean;
  feedback: string[];
}

export class ReviewSystem {
  private reviewers: Reviewer[] = [];
  private reviews: ReviewDecision[] = [];
  private approvals: ApprovalRequest[] = [];

  constructor() {
    this.reviewers = [
      { id: 'tech-lead', name: 'Tech Lead', types: ['architecture_review', 'code_quality'], autoApprove: false },
      { id: 'security-auditor', name: 'Security Auditor', types: ['security_audit'], autoApprove: false },
      { id: 'performance-tester', name: 'Performance Tester', types: ['performance_check'], autoApprove: false },
      { id: 'accessibility-tester', name: 'Accessibility Tester', types: ['accessibility_review'], autoApprove: false },
      { id: 'ui-designer', name: 'UI Designer', types: ['design_consistency'], autoApprove: false },
      { id: 'quality-assurance', name: 'Quality Assurance', types: ['artifact_quality', 'final_approval'], autoApprove: false }
    ];
  }

  async reviewArtifact(
    artifact: AgentArtifact,
    reviewType: ReviewType,
    reviewerId: string
  ): Promise<ReviewDecision> {
    const reviewer = this.reviewers.find(r => r.id === reviewerId);
    if (!reviewer) {
      throw new Error(`Reviewer not found: ${reviewerId}`);
    }

    const decision: ReviewDecision = {
      id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      reviewType,
      reviewer: reviewerId,
      decision: 'approved',
      comments: [],
      conditions: [],
      timestamp: new Date().toISOString()
    };

    const validation = this.validateArtifactForReview(artifact, reviewType);
    if (!validation.valid) {
      decision.decision = 'rejected';
      decision.comments = validation.errors;
    } else if (validation.warnings.length > 0) {
      decision.decision = 'needs_changes';
      decision.comments = validation.warnings;
      decision.conditions = validation.warnings;
    }

    this.reviews.push(decision);
    return decision;
  }

  private validateArtifactForReview(artifact: AgentArtifact, reviewType: ReviewType): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (reviewType) {
      case 'security_audit':
        if (artifact.type === 'api_route') {
          const content = artifact.content as Record<string, unknown>;
          if (!content.authentication) {
            warnings.push('API route may need authentication');
          }
        }
        break;

      case 'performance_check':
        if (artifact.type === 'component') {
          const content = artifact.content as Record<string, unknown>;
          if (!content.memoization) {
            warnings.push('Component may benefit from memoization');
          }
        }
        break;

      case 'accessibility_review':
        if (artifact.type === 'component' || artifact.type === 'page') {
          warnings.push('Check for ARIA labels and keyboard navigation');
        }
        break;

      case 'design_consistency':
        if (artifact.type === 'component') {
          warnings.push('Verify component follows design system');
        }
        break;

      case 'architecture_review':
        if (!artifact.metadata.dependencies || artifact.metadata.dependencies.length === 0) {
          warnings.push('No dependencies defined - may indicate isolated component');
        }
        break;

      case 'code_quality':
        if (!artifact.metadata.exports || artifact.metadata.exports.length === 0) {
          warnings.push('No exports defined');
        }
        break;

      case 'artifact_quality':
        if (!artifact.name) {
          errors.push('Artifact must have a name');
        }
        break;

      case 'final_approval':
        if (artifact.status !== 'validated' && artifact.status !== 'repaired') {
          errors.push('Artifact must be validated or repaired before final approval');
        }
        break;
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async requestApproval(
    artifact: AgentArtifact,
    requestor: string,
    level: ApprovalLevel,
    deadlineMinutes: number = 60
  ): Promise<ApprovalRequest> {
    const request = createApprovalRequest(artifact.id, requestor, level, deadlineMinutes);

    const requiredReviewers = this.getRequiredReviewers(artifact.type);
    request.approvers = requiredReviewers.map(r => r.id);

    this.approvals.push(request);
    return request;
  }

  private getRequiredReviewers(artifactType: string): Reviewer[] {
    switch (artifactType) {
      case 'api_route':
      case 'security_config':
        return this.reviewers.filter(r => r.types.includes('security_audit'));
      case 'component':
      case 'page':
        return this.reviewers.filter(r => 
          r.types.includes('design_consistency') || 
          r.types.includes('accessibility_review')
        );
      case 'config':
      case 'deployment_config':
        return this.reviewers.filter(r => r.types.includes('architecture_review'));
      default:
        return this.reviewers.filter(r => r.types.includes('artifact_quality'));
    }
  }

  async processApproval(
    requestId: string,
    reviewerId: string,
    decision: 'approved' | 'rejected',
    comments: string[] = []
  ): Promise<ApprovalRequest | null> {
    const request = this.approvals.find(a => a.id === requestId);
    if (!request) return null;

    const reviewDecision: ReviewDecision = {
      id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      reviewType: 'final_approval',
      reviewer: reviewerId,
      decision,
      comments,
      conditions: [],
      timestamp: new Date().toISOString()
    };

    request.decisions.push(reviewDecision);

    const allApproved = request.approvers.every(approverId => {
      const decision = request.decisions.find(d => d.reviewer === approverId);
      return decision && decision.decision === 'approved';
    });

    const anyRejected = request.decisions.some(d => d.decision === 'rejected');

    if (allApproved) {
      request.status = 'approved';
    } else if (anyRejected) {
      request.status = 'rejected';
    }

    return request;
  }

  getReviews(): ReviewDecision[] {
    return [...this.reviews];
  }

  getApprovals(): ApprovalRequest[] {
    return [...this.approvals];
  }

  getPendingApprovals(): ApprovalRequest[] {
    return this.approvals.filter(a => a.status === 'pending');
  }

  getStats(): {
    totalReviews: number;
    approved: number;
    rejected: number;
    needsChanges: number;
    totalApprovals: number;
    pendingApprovals: number;
    approvedApprovals: number;
    rejectedApprovals: number;
  } {
    return {
      totalReviews: this.reviews.length,
      approved: this.reviews.filter(r => r.decision === 'approved').length,
      rejected: this.reviews.filter(r => r.decision === 'rejected').length,
      needsChanges: this.reviews.filter(r => r.decision === 'needs_changes').length,
      totalApprovals: this.approvals.length,
      pendingApprovals: this.approvals.filter(a => a.status === 'pending').length,
      approvedApprovals: this.approvals.filter(a => a.status === 'approved').length,
      rejectedApprovals: this.approvals.filter(a => a.status === 'rejected').length
    };
  }

  clear(): void {
    this.reviews = [];
    this.approvals = [];
  }
}

export function createReviewSystem(): ReviewSystem {
  return new ReviewSystem();
}
