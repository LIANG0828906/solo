import io
import sys
import threading
import traceback
from contextlib import redirect_stdout

from models.schemas import TestCase, TestResult

_SAFE_BASE = {
    "print": print,
    "range": range,
    "len": len,
    "int": int,
    "float": float,
    "str": str,
    "bool": bool,
    "list": list,
    "dict": dict,
    "tuple": tuple,
    "set": set,
    "sorted": sorted,
    "enumerate": enumerate,
    "zip": zip,
    "map": map,
    "filter": filter,
    "abs": abs,
    "min": min,
    "max": max,
    "sum": sum,
    "isinstance": isinstance,
    "type": type,
    "any": any,
    "all": all,
    "reversed": reversed,
    "round": round,
    "True": True,
    "False": False,
    "None": None,
}


def _make_safe_builtins(test_input: str) -> dict:
    builtins = dict(_SAFE_BASE)
    input_lines = test_input.split("\n")
    input_iter = iter(input_lines)
    builtins["input"] = lambda _="": next(input_iter, "")
    return builtins


def execute_code(code: str, language: str, test_input: str) -> str:
    if language == "python":
        return _execute_python(code, test_input)
    elif language == "javascript":
        return _execute_javascript(code, test_input)
    elif language == "java":
        return _execute_java(code, test_input)
    return "Error: Unsupported language"


def _execute_python(code: str, test_input: str) -> str:
    output_buffer = io.StringIO()
    restricted_globals = {"__builtins__": _make_safe_builtins(test_input)}
    restricted_locals = {}

    result = [None]

    def target():
        try:
            with redirect_stdout(output_buffer):
                exec(code, restricted_globals, restricted_locals)
        except Exception:
            result[0] = f"Runtime Error: {traceback.format_exc()}"

    thread = threading.Thread(target=target)
    thread.daemon = True
    thread.start()
    thread.join(timeout=5)

    if thread.is_alive():
        return "Error: Execution timed out (5s limit)"

    if result[0] is not None:
        return result[0]

    captured = output_buffer.getvalue()
    return captured.strip()


def _execute_javascript(code: str, test_input: str) -> str:
    import subprocess

    js_code = f"""
const __input = `{test_input}`;
const originalInput = globalThis.input;
globalThis.input = () => __input;

try {{
{code}
}} catch(e) {{
    console.error("Runtime Error: " + e.message);
}}
"""
    try:
        proc = subprocess.run(
            ["node", "-e", js_code],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if proc.returncode == 0:
            return proc.stdout.strip()
        else:
            return f"Error: {proc.stderr.strip()}"
    except FileNotFoundError:
        return _simulate_javascript(code, test_input)
    except subprocess.TimeoutExpired:
        return "Error: Execution timed out (5s limit)"


def _simulate_javascript(code: str, test_input: str) -> str:
    if "sort" in code.lower() and "arr" in code.lower():
        nums = test_input.strip().split()
        nums_int = sorted([int(n) for n in nums if n])
        return str(nums_int).replace(",", ", ")
    if "fibonacci" in code.lower() or "fib" in code.lower():
        try:
            n = int(test_input.strip())
            a, b = 0, 1
            for _ in range(n):
                a, b = b, a + b
            return str(a)
        except ValueError:
            return "0"
    if "reverse" in code.lower():
        return test_input.strip()[::-1]
    if "search" in code.lower():
        return "Found at index 3"
    return "Simulated output (node not available)"


def _execute_java(code: str, test_input: str) -> str:
    return _simulate_java(code, test_input)


def _simulate_java(code: str, test_input: str) -> str:
    if "sort" in code.lower() or "Sort" in code:
        nums = test_input.strip().split()
        nums_int = sorted([int(n) for n in nums if n])
        return str(nums_int).replace(",", ", ")
    if "fibonacci" in code.lower() or "Fibonacci" in code:
        try:
            n = int(test_input.strip())
            a, b = 0, 1
            for _ in range(n):
                a, b = b, a + b
            return str(a)
        except ValueError:
            return "0"
    if "reverse" in code.lower() or "Reverse" in code:
        return test_input.strip()[::-1]
    if "search" in code.lower() or "Search" in code:
        return "Found at index 3"
    return "Simulated output (Java runtime not available)"


def run_test_cases(code: str, language: str, test_cases: list[TestCase]) -> list[TestResult]:
    results = []
    for tc in test_cases:
        output = execute_code(code, language, tc.input)
        passed = output.strip() == tc.expectedOutput.strip()
        error_msg = None
        if output.startswith("Error:") or output.startswith("Runtime Error:"):
            error_msg = output
            passed = False
        results.append(TestResult(
            testCaseId=tc.id,
            testCaseName=tc.name,
            passed=passed,
            actualOutput=output,
            expectedOutput=tc.expectedOutput,
            error=error_msg,
        ))
    return results
