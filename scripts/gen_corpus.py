#!/usr/bin/env python3
"""
Generates the synthetic vendor corpus for Consensus.

These are the documents the demo runs on, so two properties matter more than
realism:

  1. A real text layer. pdf.js must extract clean text; a scanned-looking
     image would exercise nothing.
  2. A planted contradiction with known coordinates. vendor-a-dpa.pdf page 13
     states that the EU subprocessor arrangement is pending. That single
     sentence is what the agent quotes back at 1:50 in the demo when it
     challenges an inflated data-residency score.

Every company named here is invented. See public/sample/README.md.
"""

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
)
from reportlab.lib import colors
import os, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else "./sample"
os.makedirs(OUT, exist_ok=True)

styles = getSampleStyleSheet()
H1 = ParagraphStyle('H1', parent=styles['Heading1'], fontSize=15, spaceAfter=10, textColor=colors.HexColor('#111111'))
H2 = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=11.5, spaceBefore=10, spaceAfter=6, textColor=colors.HexColor('#222222'))
BODY = ParagraphStyle('BODY', parent=styles['BodyText'], fontSize=9.5, leading=14, alignment=TA_JUSTIFY, spaceAfter=7)
SMALL = ParagraphStyle('SMALL', parent=styles['BodyText'], fontSize=8, leading=11, textColor=colors.HexColor('#555555'))

def build(filename, title, flow):
    doc = SimpleDocTemplate(
        os.path.join(OUT, filename), pagesize=LETTER,
        leftMargin=0.9*inch, rightMargin=0.9*inch, topMargin=0.9*inch, bottomMargin=0.9*inch,
        title=title, author="Synthetic corpus for Consensus",
    )
    doc.build(flow)
    print(f"  {filename}")

def p(t):  return Paragraph(t, BODY)
def h1(t): return Paragraph(t, H1)
def h2(t): return Paragraph(t, H2)
def note(t): return Paragraph(t, SMALL)
def gap(h=8): return Spacer(1, h)

BANNER = ("SYNTHETIC DOCUMENT — generated for demonstration purposes. All entity names, "
          "figures, dates and findings are invented. This document describes no real company.")

# ── filler paragraphs, varied so BM25 has real vocabulary to work with ──────
LEGAL = [
 "The Processor shall implement and maintain appropriate technical and organisational measures designed to protect Personal Data against accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to Personal Data transmitted, stored or otherwise processed.",
 "The Controller retains sole responsibility for determining the purposes and means of processing and for the accuracy, quality and legality of Personal Data supplied to the Processor under this Agreement.",
 "Each party shall promptly notify the other upon becoming aware of any circumstance likely to give rise to a material breach of the obligations set out in this Agreement, including any regulatory inquiry that concerns the processing activities described herein.",
 "Nothing in this Agreement shall be construed as transferring ownership of Personal Data, and the Processor acquires no right, title or interest in such data other than the limited licence necessary to perform the Services.",
 "The Processor shall ensure that persons authorised to process Personal Data have committed themselves to confidentiality or are under an appropriate statutory obligation of confidentiality.",
 "Where the Processor engages another processor for carrying out specific processing activities on behalf of the Controller, the same data protection obligations set out in this Agreement shall be imposed on that other processor by way of a contract.",
 "The Processor shall make available to the Controller all information necessary to demonstrate compliance with the obligations laid down in this section and allow for and contribute to audits, including inspections, conducted by the Controller or another auditor mandated by the Controller.",
 "Audit rights under this section may be exercised no more than once in any twelve month period, save where an audit is required by a supervisory authority or follows a Personal Data Breach affecting the Controller.",
 "Following termination of the Services, the Processor shall, at the choice of the Controller, delete or return all Personal Data and delete existing copies unless applicable law requires continued storage.",
 "The Processor shall maintain a written record of all categories of processing activities carried out on behalf of the Controller and shall make that record available to a supervisory authority on request.",
]

CTRL = [
 "The organisation maintains a documented information security policy that is reviewed and approved by management at least annually and communicated to all personnel and relevant external parties.",
 "Logical access to production systems is granted on the basis of least privilege and is reviewed quarterly by system owners. Access is revoked within one business day of termination.",
 "Changes to production systems follow a documented change management process requiring peer review, automated testing and documented approval prior to deployment.",
 "Vulnerability scans are performed on a continuous basis against internet-facing assets, and identified findings are triaged according to a documented severity matrix.",
 "Production data is encrypted at rest using AES-256 and in transit using TLS 1.2 or higher. Key material is managed through a dedicated key management service with rotation performed annually.",
 "Backup procedures are executed daily with restoration testing performed on a quarterly basis. Backup media is encrypted and stored in a geographically separate facility.",
 "Security awareness training is delivered to all personnel upon hire and annually thereafter, with completion tracked and reported to management.",
 "Incident response procedures are documented, assigned to named owners, and exercised through tabletop simulation at least annually.",
 "Monitoring and alerting is configured across production infrastructure with alerts routed to an on-call rotation staffed twenty-four hours per day.",
 "Vendor risk assessments are performed prior to onboarding any subprocessor with access to customer data, and are refreshed on a defined cadence thereafter.",
]

def filler(pool, n, offset=0):
    return [p(pool[(i + offset) % len(pool)]) for i in range(n)]

# ══════════════════════════════════════════════════════════════════════════
#  vendor-a-dpa.pdf  ·  22 pages  ·  ★ CONTRADICTION ON PAGE 13
# ══════════════════════════════════════════════════════════════════════════
def vendor_a_dpa():
    f = [h1("NorthWind Analytics, Inc."),
         h2("Data Processing Agreement"),
         note(BANNER), gap(14),
         p("This Data Processing Agreement (the &ldquo;Agreement&rdquo;) forms part of the Master Services "
           "Agreement between NorthWind Analytics, Inc. (&ldquo;Processor&rdquo;) and the Customer identified "
           "in the applicable Order Form (&ldquo;Controller&rdquo;). It governs the processing of Personal Data "
           "by the Processor in the course of providing the Services."),
         p("Effective date: 14 March 2026. Version 4.2. This version supersedes all prior versions."),
         PageBreak()]

    sections = [
        ("1. Definitions", 2), ("2. Scope and Roles", 2), ("3. Processor Obligations", 2),
        ("4. Security Measures", 2), ("5. Personnel and Confidentiality", 1),
        ("6. Audit and Certification", 1),
    ]
    off = 0
    for title, pages in sections:
        f.append(h2(title))
        for i in range(pages):
            f += filler(LEGAL, 4, off); off += 4
            f.append(PageBreak())

    # tail of section 6 + the opening of section 7 share page 12, so that the
    # whole of 7.3-7.6 lands on page 13 where the demo fixtures expect it.
    f += filler(LEGAL, 2, off); off += 2
    f.append(h2("7. Subprocessing and Data Location"))
    f.append(p("7.1 The Controller grants the Processor general authorisation to engage subprocessors "
               "for the provision of the Services, subject to the conditions set out in this section. A "
               "current list of authorised subprocessors is maintained at the address notified to the "
               "Controller upon execution."))
    f.append(p("7.2 The Processor shall notify the Controller of any intended addition or replacement of "
               "a subprocessor not less than thirty days prior to the change taking effect, and the "
               "Controller may object on reasonable data protection grounds within that period."))
    f.append(PageBreak())

    # ── PAGE 13 · THE PLANTED CONTRADICTION ─────────────────────────────
    f.append(p("7.3 <b>Primary processing facilities.</b> Personal Data processed under this Agreement is "
               "hosted in the Processor's United States regions, specifically us-east-1 and us-west-2. "
               "Replication between these regions occurs continuously for availability and disaster "
               "recovery purposes. All primary processing, indexing and long-term storage of Customer "
               "Personal Data occurs within these two United States regions."))
    f.append(p("7.4 <b>European Union processing region.</b> An additional European Union processing "
               "region was under evaluation as of the effective date of this Agreement. The EU "
               "subprocessor arrangement described in Annex C remained pending and had not been executed "
               "at the time of publication. Accordingly, EU in-region data residency is not contractually "
               "established under this version of the Agreement."))
    f.append(p("7.5 Customers requiring in-region European Union processing as a contractual commitment "
               "should confirm the current deployment status and subprocessor arrangement with their "
               "account representative in writing before relying on the provisions of this section. The "
               "Processor makes no representation in this Agreement that EU-only processing is available."))
    f.append(p("7.6 Cross-border transfers of Personal Data from the European Economic Area are carried "
               "out under the Standard Contractual Clauses set out in Annex B, together with the "
               "supplementary measures described in Annex D."))
    f.append(PageBreak())
    # ── END PAGE 13 ─────────────────────────────────────────────────────

    for title, pages in [("8. Personal Data Breach", 2), ("9. Data Subject Rights", 2),
                         ("10. Return and Deletion", 1), ("11. Liability", 1),
                         ("12. General Provisions", 1)]:
        f.append(h2(title))
        for i in range(pages):
            f += filler(LEGAL, 4, off); off += 4
            f.append(PageBreak())

    f.append(h2("Annex C — Subprocessor Register"))
    f.append(p("The following subprocessors are authorised as of the effective date. Entries marked "
               "&ldquo;pending&rdquo; have not been executed and confer no contractual right of reliance."))
    t = Table([
        ["Subprocessor", "Purpose", "Location", "Status"],
        ["Cirrus Compute", "Infrastructure", "us-east-1", "Executed"],
        ["Cirrus Compute", "Infrastructure", "us-west-2", "Executed"],
        ["Halden Systems", "Log aggregation", "us-east-1", "Executed"],
        ["Meridian Hosting BV", "EU processing region", "eu-west-1", "Pending — not executed"],
        ["Orbit Mail", "Transactional email", "us-east-1", "Executed"],
    ], colWidths=[1.6*inch, 1.7*inch, 1.5*inch, 1.9*inch])
    t.setStyle(TableStyle([
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#EEEEEE')),
        ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor('#BBBBBB')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    f += [t, gap(12), p("The pending entry above reflects an arrangement under negotiation. It does not "
                        "constitute an authorised subprocessor for the purposes of section 7.")]
    build("vendor-a-dpa.pdf", "NorthWind Analytics — Data Processing Agreement", f)

# ══════════════════════════════════════════════════════════════════════════
#  vendor-b-soc2.pdf  ·  30 pages  ·  availability exception around page 14
# ══════════════════════════════════════════════════════════════════════════
def vendor_b_soc2():
    f = [h1("Meridian Data Systems, Inc."),
         h2("SOC 2 Type II Report — Independent Service Auditor's Report"),
         h2("Trust Services Criteria: Security, Availability, Confidentiality"),
         note(BANNER), gap(12),
         p("Review period: 1 January 2026 through 31 December 2026. Report issued 12 February 2026 by "
           "Ashgrove &amp; Finn LLP, Independent Service Auditors."),
         p("<b>Distribution restriction.</b> This report is intended solely for the information and use "
           "of Meridian Data Systems, user entities of the system during the period, and prospective "
           "user entities under a non-disclosure agreement. It is not intended for and should not be "
           "used by anyone other than these specified parties."),
         PageBreak(),
         h2("Section I — Independent Service Auditor's Report"),
         p("We have examined Meridian Data Systems' description of its analytics platform system and "
           "the suitability of the design and operating effectiveness of controls stated in the "
           "description throughout the period."),
         p("<b>Opinion.</b> In our opinion, except for the matter described in the Basis for Qualified "
           "Opinion paragraph, the description presents the system that was designed and implemented "
           "throughout the period, and the controls stated were suitably designed and operated "
           "effectively throughout the period."),
         PageBreak()]

    off = 0
    for title, pages in [("Section II — Management's Assertion", 2),
                         ("Section III — Description of the System", 3),
                         ("Section IV — Control Environment", 3),
                         ("Section V — Risk Assessment", 3)]:
        f.append(h2(title))
        for i in range(pages):
            f += filler(CTRL, 4, off); off += 4
            f.append(PageBreak())

    # ── PAGE 14 ─────────────────────────────────────────────────────────
    f.append(h2("Section VI — Availability Criteria and Exceptions"))
    f.append(p("A1.1 The entity maintains, monitors and evaluates current processing capacity and use "
               "of system components to manage capacity demand and to enable the implementation of "
               "additional capacity to help meet its availability objectives."))
    f.append(p("<b>Exception noted.</b> During the period 3 August 2026 through 19 September 2026, "
               "automated capacity alerting for the primary analytics ingestion tier was disabled "
               "following a monitoring platform migration. The control did not operate for forty-seven "
               "days. Management identified the gap during an internal review rather than through the "
               "monitoring system itself."))
    f.append(p("<b>Effect of the exception.</b> Two availability incidents occurred within the affected "
               "window. Incident INC-2026-0812 resulted in degraded query performance for approximately "
               "four hours. Incident INC-2026-0903 resulted in a partial service outage of one hour and "
               "fifty minutes affecting a subset of user entities in the us-east region. Neither incident "
               "was detected by automated alerting; both were reported by user entities."))
    f.append(p("<b>Management response.</b> Alerting was restored on 19 September 2026 and coverage "
               "verification was added to the monitoring migration runbook. Management represents that "
               "no data loss occurred. The auditors did not test the effectiveness of the remediation, "
               "which was implemented after the close of the review period."))
    f.append(p("A1.2 The entity authorises, designs, develops, acquires, implements, operates, approves, "
               "maintains and monitors environmental protections, software, data backup processes and "
               "recovery infrastructure to meet its availability objectives. No exceptions noted."))
    f.append(p("A1.3 The entity tests recovery plan procedures supporting system recovery to meet its "
               "availability objectives. Recovery testing was performed on 14 April 2026 and 8 October "
               "2026. No exceptions noted."))
    f.append(PageBreak())
    # ── END PAGE 14 ─────────────────────────────────────────────────────

    for title, pages in [("Section VII — Confidentiality Criteria", 3),
                         ("Section VIII — Logical Access Controls", 3),
                         ("Section IX — Change Management", 3),
                         ("Section X — Subservice Organisations", 2),
                         ("Section XI — Complementary User Entity Controls", 3),
                         ("Section XII — Other Information", 2)]:
        f.append(h2(title))
        for i in range(pages):
            f += filler(CTRL, 4, off); off += 4
            f.append(PageBreak())

    f.append(h2("Summary of Testing Exceptions"))
    t = Table([
        ["Criterion", "Control", "Result"],
        ["CC6.1", "Logical access provisioning", "No exceptions"],
        ["CC7.2", "Security event monitoring", "No exceptions"],
        ["A1.1", "Capacity alerting", "Exception — 47 day gap"],
        ["A1.2", "Backup and recovery infrastructure", "No exceptions"],
        ["A1.3", "Recovery plan testing", "No exceptions"],
        ["C1.1", "Confidential information identification", "No exceptions"],
    ], colWidths=[1.1*inch, 2.9*inch, 2.7*inch])
    t.setStyle(TableStyle([
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#EEEEEE')),
        ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor('#BBBBBB')),
        ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    f.append(t)
    build("vendor-b-soc2.pdf", "Meridian Data Systems — SOC 2 Type II Report", f)

# ══════════════════════════════════════════════════════════════════════════
#  vendor-c-pricing.pdf  ·  8 pages  ·  overage terms on page 3
# ══════════════════════════════════════════════════════════════════════════
def vendor_c_pricing():
    f = [h1("Corvus Analytics Ltd."),
         h2("Pricing Schedule and Commercial Terms"),
         note(BANNER), gap(12),
         p("Quotation reference CVS-2026-4471. Valid for sixty days from 2 April 2026. All amounts "
           "in USD, exclusive of applicable taxes."),
         p("<b>Confidential.</b> This pricing is provided under the mutual non-disclosure agreement "
           "dated 11 March 2026 and may not be disclosed to third parties."),
         PageBreak(),
         h2("1. Subscription Tiers")]
    t = Table([
        ["Tier", "Annual", "Events / month", "Retention", "Support"],
        ["Standard", "$18,000", "50 million", "13 months", "Business hours"],
        ["Growth", "$42,000", "200 million", "24 months", "24x5"],
        ["Enterprise", "$96,000", "1 billion", "36 months", "24x7"],
    ], colWidths=[1.1*inch, 1.1*inch, 1.4*inch, 1.1*inch, 1.4*inch])
    t.setStyle(TableStyle([
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#EEEEEE')),
        ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor('#BBBBBB')),
        ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    f += [t, gap(12),
          p("Pricing assumes annual prepayment. Quarterly billing is available at a twelve percent "
            "premium. Multi-year commitments of three years or longer receive a nine percent discount "
            "applied to the annual subscription fee."),
          PageBreak(),
          h2("2. Overage and Usage Terms"),
          p("<b>2.1 Event overage.</b> Usage in excess of the contracted monthly event allowance is "
            "billed at $0.42 per additional one thousand events. Overage is assessed monthly and is not "
            "averaged across the contract term. There is no cap on overage charges."),
          p("<b>2.2 Burst allowance.</b> A single calendar month per contract year may exceed the "
            "allowance by up to twenty percent without incurring overage charges. The burst allowance "
            "does not carry forward and cannot be applied retroactively."),
          p("<b>2.3 Retention overage.</b> Data retained beyond the contracted retention window is "
            "billed at $180 per terabyte per month. Retention extensions must be requested in writing "
            "and are applied prospectively only."),
          p("<b>2.4 Seat overage.</b> The Standard and Growth tiers include twenty-five and one hundred "
            "named seats respectively. Additional seats are billed at $240 per seat per year, prorated "
            "to the remaining contract term."),
          p("<b>2.5 True-up.</b> Where sustained usage exceeds the contracted allowance for three "
            "consecutive months, Corvus reserves the right to require a mid-term upgrade to the next "
            "tier at the then-current list price."),
          PageBreak(),
          h2("3. Professional Services"),
          p("Implementation services are quoted separately and are billed at $220 per hour. A standard "
            "implementation is scoped at eighty hours and includes data source configuration, schema "
            "mapping and two training sessions."),
          p("Custom connector development is quoted on a fixed-fee basis following a scoping engagement. "
            "Historical data migration is billed at $2,400 per terabyte with a minimum engagement of "
            "two terabytes."),
          PageBreak(),
          h2("4. Term and Renewal"),
          p("The initial term is twelve months from the Service Commencement Date unless otherwise "
            "specified. Renewal is automatic for successive twelve month periods unless either party "
            "provides written notice of non-renewal not less than sixty days before the end of the "
            "then-current term."),
          p("Renewal pricing is subject to an uplift not exceeding seven percent of the prior term's "
            "annual subscription fee, except where usage has increased such that a tier change applies."),
          PageBreak(),
          h2("5. Payment Terms"),
          p("Invoices are payable net thirty from the invoice date. Amounts unpaid after the due date "
            "accrue interest at one and one half percent per month or the maximum rate permitted by "
            "applicable law, whichever is lower."),
          PageBreak(),
          h2("6. Assumptions and Exclusions"),
          p("This quotation assumes a single production environment and one non-production environment. "
            "Additional environments are billed at thirty percent of the applicable tier fee."),
          p("Pricing excludes third-party costs, including any data warehouse, object storage or "
            "identity provider charges incurred by the Customer directly.")]
    build("vendor-c-pricing.pdf", "Corvus Analytics — Pricing Schedule", f)

# ══════════════════════════════════════════════════════════════════════════
#  vendor-a-security-questionnaire.pdf  ·  12 pages
# ══════════════════════════════════════════════════════════════════════════
def vendor_a_questionnaire():
    f = [h1("NorthWind Analytics, Inc."),
         h2("Vendor Security Questionnaire — Completed Response"),
         note(BANNER), gap(12),
         p("Completed 22 March 2026 by the NorthWind Analytics security team in response to the "
           "Customer's standard assessment. Responses reflect the state of the environment as of "
           "the completion date."),
         PageBreak()]
    qa = [
      ("Do you enforce multi-factor authentication for all personnel?",
       "MFA is enforced organisation-wide for all personnel accessing production systems. Enforcement "
       "is applied at the identity provider level and cannot be bypassed by individual users."),
      ("Where is customer data processed and stored?",
       "Customer data is processed in the us-east-1 and us-west-2 regions. An EU region is on the "
       "roadmap; customers with EU residency requirements should discuss current status with their "
       "account team, as arrangements are not yet finalised."),
      ("Do you hold a current SOC 2 Type II report?",
       "A SOC 2 Type II report covering Security and Confidentiality is available under NDA. The "
       "Availability criterion is not currently in scope for our report."),
      ("Describe your encryption practices.",
       "Data is encrypted at rest with AES-256 and in transit with TLS 1.3. Keys are managed through "
       "a managed KMS with annual rotation."),
      ("How do you manage subprocessors?",
       "A subprocessor register is maintained and published. Customers receive thirty days' notice of "
       "additions or replacements and may object on data protection grounds."),
      ("What is your incident notification commitment?",
       "We commit to notifying affected customers within seventy-two hours of confirming a personal "
       "data breach affecting their data."),
      ("Do you perform penetration testing?",
       "An independent penetration test is commissioned annually. A summary letter is available under "
       "NDA; the full report is not distributed externally."),
      ("How is access to production data controlled?",
       "Access follows least privilege, requires named approval, is time-bound for elevated roles, and "
       "is reviewed quarterly."),
      ("Do you have a documented business continuity plan?",
       "A business continuity plan is documented and exercised annually. The most recent exercise was "
       "conducted in November 2026."),
      ("What is your data retention and deletion policy?",
       "Customer data is retained for the contracted period. On termination, data is deleted within "
       "thirty days unless a longer period is required by law."),
      ("Do you use customer data for model training?",
       "No. Customer data is not used to train shared models. Any customer-specific model artefacts "
       "remain isolated to that customer's tenant."),
      ("Describe your logging and monitoring coverage.",
       "Production infrastructure is monitored continuously with alerts routed to a twenty-four hour "
       "on-call rotation. Audit logs are retained for eighteen months."),
    ]
    for i, (q, a) in enumerate(qa, 1):
        f.append(h2(f"Q{i}. {q}"))
        f.append(p(a))
        f += filler(CTRL, 2, i * 3)
        f.append(PageBreak())
    build("vendor-a-security-questionnaire.pdf", "NorthWind Analytics — Security Questionnaire", f)

# ══════════════════════════════════════════════════════════════════════════
#  vendor-b-dpa.pdf  ·  16 pages
# ══════════════════════════════════════════════════════════════════════════
def vendor_b_dpa():
    f = [h1("Meridian Data Systems, Inc."),
         h2("Data Processing Addendum"),
         note(BANNER), gap(12),
         p("This Data Processing Addendum supplements the Meridian Data Systems Master Subscription "
           "Agreement. Effective 1 February 2026, version 3.1."),
         PageBreak()]
    off = 0
    for title, pages in [("1. Definitions and Interpretation", 2), ("2. Processing Instructions", 2),
                         ("3. Confidentiality and Personnel", 2), ("4. Security of Processing", 2),
                         ("5. Subprocessing", 2)]:
        f.append(h2(title))
        for i in range(pages):
            f += filler(LEGAL, 4, off); off += 4
            f.append(PageBreak())

    f.append(h2("6. Data Location and International Transfers"))
    f.append(p("6.1 Meridian operates processing regions in the United States, the European Union and "
               "Australia. The Customer selects the primary processing region at the time of "
               "provisioning, and Personal Data is processed and stored within the selected region."))
    f.append(p("6.2 <b>EU region.</b> Where the Customer selects the eu-central-1 region, all primary "
               "processing, indexing and backup of Personal Data occurs within the European Union. "
               "Support access from outside the EU is available only with explicit Customer opt-in and "
               "is logged and auditable."))
    f.append(p("6.3 Cross-border transfers, where they occur, are governed by the Standard Contractual "
               "Clauses incorporated at Annex A together with a documented transfer impact assessment."))
    f.append(PageBreak())

    for title, pages in [("7. Data Subject Rights", 2), ("8. Breach Notification", 1),
                         ("9. Audit Rights", 1), ("10. Deletion and Return", 1)]:
        f.append(h2(title))
        for i in range(pages):
            f += filler(LEGAL, 4, off); off += 4
            f.append(PageBreak())
    build("vendor-b-dpa.pdf", "Meridian Data Systems — Data Processing Addendum", f)


if __name__ == "__main__":
    print("Generating synthetic corpus:")
    vendor_a_dpa()
    vendor_a_questionnaire()
    vendor_b_soc2()
    vendor_b_dpa()
    vendor_c_pricing()
    print("Done.")
