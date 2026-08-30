// lib/audit/logger.ts - Audit logging helper class

/**
 * AuditLogger - Centralized audit logging for all user actions
 * Sends logs to /api/audit-log endpoint for storage in database
 */
export class AuditLogger {
  /**
   * Generic log method for all audit events
   */
  static async log(
    action: string,
    resourceType: string,
    resourceId: string,
    details: string,
    userId?: string
  ) {
    try {
      const response = await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        console.error('Failed to log action:', await response.text());
      }
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't throw - logging failures shouldn't break app functionality
    }
  }

  // Branch-related logging
  static async logBranchCreated(branchId: string, branchName: string) {
    await this.log('branch_created', 'branch', branchId, `Branch created: ${branchName}`);
  }

  static async logBranchUpdated(branchId: string, branchName: string, changes?: string) {
    const details = changes ? `Branch updated: ${branchName} - ${changes}` : `Branch updated: ${branchName}`;
    await this.log('branch_updated', 'branch', branchId, details);
  }

  static async logBranchViewed(branchId: string) {
    await this.log('branch_viewed', 'branch', branchId, 'Branch details viewed');
  }

  static async logBranchDeleted(branchId: string, branchName: string) {
    await this.log('branch_deleted', 'branch', branchId, `Branch deleted: ${branchName}`);
  }

  // Report-related logging
  static async logReportGenerated(reportType: string, filters?: string) {
    const details = filters ? `${reportType} report generated - ${filters}` : `${reportType} report generated`;
    await this.log('report_generated', 'report', reportType, details);
  }

  static async logReportExported(reportType: string, format: string) {
    await this.log('report_exported', 'report', reportType, `${reportType} report exported as ${format}`);
  }

  // Dashboard logging
  static async logDashboardViewed() {
    await this.log('dashboard_viewed', 'dashboard', 'main', 'Dashboard accessed');
  }

  // Data action logging
  static async logDataCreated(resourceType: string, resourceId: string, name?: string) {
    const details = name ? `${resourceType} created: ${name}` : `${resourceType} created`;
    await this.log('data_created', resourceType, resourceId, details);
  }

  static async logDataUpdated(resourceType: string, resourceId: string, name?: string) {
    const details = name ? `${resourceType} updated: ${name}` : `${resourceType} updated`;
    await this.log('data_updated', resourceType, resourceId, details);
  }

  static async logDataDeleted(resourceType: string, resourceId: string, name?: string) {
    const details = name ? `${resourceType} deleted: ${name}` : `${resourceType} deleted`;
    await this.log('data_deleted', resourceType, resourceId, details);
  }

  // Bulk action logging
  static async logBulkAction(action: string, resourceType: string, count: number) {
    await this.log(
      'bulk_action',
      resourceType,
      `bulk-${Date.now()}`,
      `Bulk ${action} performed on ${count} ${resourceType}s`
    );
  }

  // Search/Filter logging
  static async logSearch(searchType: string, query: string) {
    await this.log('search_performed', 'search', `search-${Date.now()}`, `${searchType} search: ${query}`);
  }

  // Export logging
  static async logExport(resourceType: string, format: string, recordCount: number) {
    await this.log(
      'data_exported',
      resourceType,
      `export-${Date.now()}`,
      `Exported ${recordCount} ${resourceType} records as ${format}`
    );
  }

  // User-specific logging
  static async logUserManagementViewed() {
    await this.log('user_management_viewed', 'user_management', 'all', 'User management page accessed');
  }

  static async logUserViewed(userId: string, userName?: string) {
    const details = userName ? `User viewed: ${userName}` : 'User viewed';
    await this.log('user_viewed', 'user', userId, details);
  }

  static async logUserUpdated(userId: string, userName?: string) {
    const details = userName ? `User updated: ${userName}` : 'User updated';
    await this.log('user_updated', 'user', userId, details);
  }

  static async logUserStatusChanged(userId: string, newStatus: string) {
    await this.log('user_status_changed', 'user', userId, `User status changed to: ${newStatus}`);
  }
}