package com.localkart.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Records every admin action, so approvals and suspensions are accountable. */
@Service
public class AuditService {

	private final AuditRepository audit;

	public AuditService(AuditRepository audit) {
		this.audit = audit;
	}

	/** Joins the caller's transaction, so the log entry is saved only if the action itself succeeds. */
	@Transactional(propagation = Propagation.MANDATORY)
	public void log(Admin by, String action, String targetType, Object targetId, String targetLabel, String details) {
		AuditEntry e = new AuditEntry();
		e.setAdminId(by.getId());
		e.setAdminEmail(by.getEmail());
		e.setAction(action);
		e.setTargetType(targetType);
		e.setTargetId(targetId == null ? null : targetId.toString());
		e.setTargetLabel(cut(targetLabel, 200));
		e.setDetails(cut(details, 500));
		audit.save(e);
	}

	@Transactional(readOnly = true)
	public Page<AuditEntry> recent(int page, int size) {
		return audit.findAllByOrderByCreatedAtDescIdDesc(PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100)));
	}

	private static String cut(String s, int max) {
		return s == null || s.length() <= max ? s : s.substring(0, max);
	}
}
