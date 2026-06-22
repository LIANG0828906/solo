import re

from models.schemas import LintIssue


def lint_code(code: str, language: str) -> list[LintIssue]:
    if language == "python":
        return lint_python(code)
    elif language == "javascript":
        return lint_javascript(code)
    elif language == "java":
        return lint_java(code)
    return []


def lint_python(code: str) -> list[LintIssue]:
    issues = []
    lines = code.split("\n")

    has_tabs = any("\t" in line for line in lines)
    has_spaces = any(line.startswith(" ") and not line.startswith("\t") for line in lines)
    if has_tabs and has_spaces:
        for i, line in enumerate(lines, 1):
            if "\t" in line:
                issues.append(LintIssue(
                    line=i, column=1,
                    severity="error",
                    message="Mixed tabs and spaces in indentation",
                    rule="indentation-mixed",
                ))
                break

    for i, line in enumerate(lines, 1):
        if len(line) > 120:
            issues.append(LintIssue(
                line=i, column=121,
                severity="warning",
                message=f"Line too long ({len(line)} > 120 characters)",
                rule="line-length",
            ))

    func_pattern = re.compile(r"^\s*def\s+([A-Za-z_][A-Za-z0-9_]*)")
    for i, line in enumerate(lines, 1):
        m = func_pattern.match(line)
        if m:
            name = m.group(1)
            if re.search(r"[A-Z]", name) and not name.startswith("_"):
                issues.append(LintIssue(
                    line=i, column=m.start() + 1,
                    severity="warning",
                    message=f"Function '{name}' should use snake_case naming",
                    rule="naming-function",
                ))

    var_pattern = re.compile(r"^\s*([a-z][a-zA-Z0-9]*)\s*=")
    for i, line in enumerate(lines, 1):
        m = var_pattern.match(line)
        if m:
            name = m.group(1)
            if re.search(r"[A-Z]", name):
                issues.append(LintIssue(
                    line=i, column=1,
                    severity="warning",
                    message=f"Variable '{name}' should use snake_case naming",
                    rule="naming-variable",
                ))

    for i, line in enumerate(lines, 1):
        m = func_pattern.match(line)
        if m:
            func_indent = len(line) - len(line.lstrip())
            found_docstring = False
            for j in range(i, min(i + 3, len(lines))):
                stripped = lines[j].strip()
                if stripped.startswith('"""') or stripped.startswith("'''"):
                    found_docstring = True
                    break
                if stripped and not stripped.startswith("#") and not stripped.startswith("def "):
                    break
            if not found_docstring:
                issues.append(LintIssue(
                    line=i, column=1,
                    severity="warning",
                    message=f"Function '{m.group(1)}' is missing a docstring",
                    rule="missing-docstring",
                ))

    return issues


def lint_javascript(code: str) -> list[LintIssue]:
    issues = []
    lines = code.split("\n")

    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if not stripped or stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
            continue
        if stripped.endswith("{") or stripped.endswith("}") or stripped.endswith("(") or stripped.endswith(","):
            continue
        if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
            continue
        if any(kw in stripped for kw in ["function", "if", "else", "for", "while", "switch", "catch"]):
            continue
        if not stripped.endswith(";") and not stripped.endswith("{") and not stripped.endswith("}"):
            if re.search(r"(let|const|var)\s+", stripped) or re.search(r"=\s*.+", stripped):
                if not stripped.endswith(";"):
                    issues.append(LintIssue(
                        line=i, column=len(stripped) + 1,
                        severity="warning",
                        message="Missing semicolon",
                        rule="missing-semicolon",
                    ))

    has_curly_open = any("{" in line for line in lines)
    if has_curly_open:
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            if stripped.startswith("}") and len(stripped) > 1:
                issues.append(LintIssue(
                    line=i, column=1,
                    severity="warning",
                    message="Closing brace should be on its own line",
                    rule="bracket-style",
                ))

    for i, line in enumerate(lines, 1):
        if re.search(r"\bvar\b", line):
            issues.append(LintIssue(
                line=i, column=line.index("var") + 1 if "var" in line else 1,
                severity="warning",
                message="Use 'const' or 'let' instead of 'var'",
                rule="no-var",
            ))

    has_strict = any('"use strict"' in line or "'use strict'" in line for line in lines)
    if not has_strict and len(lines) > 3:
        issues.append(LintIssue(
            line=1, column=1,
            severity="warning",
            message="Missing 'use strict' directive",
            rule="strict-mode",
        ))

    return issues


def lint_java(code: str) -> list[LintIssue]:
    issues = []
    lines = code.split("\n")

    class_pattern = re.compile(r"\bclass\s+([A-Za-z_][A-Za-z0-9_]*)")
    for i, line in enumerate(lines, 1):
        m = class_pattern.search(line)
        if m:
            name = m.group(1)
            if not re.match(r"^[A-Z][a-zA-Z0-9]*$", name):
                issues.append(LintIssue(
                    line=i, column=m.start() + 1,
                    severity="error",
                    message=f"Class '{name}' should use PascalCase naming",
                    rule="naming-class",
                ))

    method_pattern = re.compile(r"\b(public|private|protected|static)\s+\S+\s+([a-z][A-Za-z0-9]*)\s*\(")
    for i, line in enumerate(lines, 1):
        m = method_pattern.search(line)
        if m:
            name = m.group(2)
            if not re.match(r"^[a-z][a-zA-Z0-9]*$", name):
                issues.append(LintIssue(
                    line=i, column=m.start(2) + 1,
                    severity="warning",
                    message=f"Method '{name}' should use camelCase naming",
                    rule="naming-method",
                ))

    method_all = re.compile(r"(?<!\bclass\s)(?:public|private|protected)\s+\S+\s+\w+\s*\(")
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if (
            re.match(r"^\w+\s+\w+\s+\w+\s*\(", stripped)
            and not stripped.startswith("public")
            and not stripped.startswith("private")
            and not stripped.startswith("protected")
            and "class" not in stripped
        ):
            issues.append(LintIssue(
                line=i, column=1,
                severity="warning",
                message="Method is missing an access modifier (public/private/protected)",
                rule="missing-access-modifier",
            ))

    return issues
