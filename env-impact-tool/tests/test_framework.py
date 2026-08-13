"""Run with:  python -m pytest tests/  (or just: python tests/test_framework.py)"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from framework import scoring, report


def test_bucketing_rules():
    b = scoring.bucket_indicator
    assert b("High", "High") == scoring.BUCKET_CORE
    assert b("Medium", "High") == scoring.BUCKET_CORE
    assert b("Low", "High") == scoring.BUCKET_ASPIRATIONAL
    assert b("High", "Low") == scoring.BUCKET_EXCLUDED
    assert b("Medium", "Low") == scoring.BUCKET_EXCLUDED
    assert b("High", "Medium") == scoring.BUCKET_SUPPLEMENTARY
    assert b("Medium", "Medium") == scoring.BUCKET_OPTIONAL


def test_vanity_metric_warning():
    selected = {"x": {"category": "c", "feasibility": "High", "relevance": "Low"}}
    checks = scoring.run_integrity_checks(selected, {}, [])
    assert any("vanity" in msg.lower() for sev, msg in checks if sev == "warning")


def test_json_roundtrip_bumps_version():
    state = {k: None for k in report.PERSISTED_KEYS}
    state.update({"startup_name": "T", "assessment_version": 1,
                  "selected_indicators": {}, "uncertainty": {}, "pathway": {}})
    restored = report.import_state(report.export_state(state))
    assert restored["assessment_version"] == 2


def _minimal_state():
    return {
        "startup_name": "T", "startup_desc": "", "sector": "", "stage": "Ideation",
        "mechanism": "Direct", "orientation": "Primary", "is_hybrid": False,
        "secondary_mechanism": None, "pathway": {}, "weakest_links": "",
        "selected_indicators": {}, "custom_indicators": {}, "uncertainty": {},
        "assessment_version": 1, "next_review_milestone": "", "review_notes": "",
        "pathway_stage_names": [],
    }


def test_docx_export_produces_valid_zip():
    """A .docx is a zip archive; a valid one must at least contain
    word/document.xml. This also exercises every section builder with
    empty/edge-case data (no pathway, no indicators, no uncertainty)."""
    import io
    import zipfile

    data = report.assemble(_minimal_state())
    docx_bytes = report.to_docx(data)
    assert len(docx_bytes) > 1000
    zf = zipfile.ZipFile(io.BytesIO(docx_bytes))
    names = zf.namelist()
    assert "word/document.xml" in names
    assert zf.testzip() is None  # no corrupt entries


def test_docx_export_with_full_data():
    state = _minimal_state()
    state["pathway"] = {"Product life cycle": [
        {"stage": "Activities: product design & development", "description": "d",
         "assumption": "a", "evidence": "Weak (assumption only)"}]}
    state["selected_indicators"] = {
        "Total energy use over a defined period": {
            "category": "Resource & Energy Input", "feasibility": "High",
            "relevance": "High", "unit": "kWh", "current_value": "100",
            "target": "", "frequency": "Annually", "data_source": "meters",
            "pathway_link": "", "citation": "neumann2023"},
    }
    state["uncertainty"] = {
        "Total energy use over a defined period": {
            "level": "Measured", "claim": "100 kWh/yr", "assumptions": "meter readings",
            "conditions": ""},
    }
    data = report.assemble(state)
    docx_bytes = report.to_docx(data)
    assert len(docx_bytes) > 1000


if __name__ == "__main__":
    test_bucketing_rules()
    test_vanity_metric_warning()
    test_json_roundtrip_bumps_version()
    test_docx_export_produces_valid_zip()
    test_docx_export_with_full_data()
    print("all tests passed")
