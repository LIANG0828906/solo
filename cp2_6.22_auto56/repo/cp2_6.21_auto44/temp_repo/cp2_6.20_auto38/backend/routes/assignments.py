from fastapi import APIRouter, HTTPException

from models.schemas import Assignment, TestCase

router = APIRouter(prefix="/api", tags=["assignments"])

ASSIGNMENTS: list[Assignment] = [
    Assignment(
        id="assign-001",
        title="Bubble Sort Implementation",
        description="""## Bubble Sort Implementation

Implement the **Bubble Sort** algorithm to sort an array of integers in ascending order.

### Algorithm Overview

Bubble Sort repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. The pass through the list is repeated until the list is sorted.

### Function Signature

```python
def bubble_sort(arr):
    # Your code here
    pass
```

### Example

**Input:**
```
5 3 8 1 2
```

**Output:**
```
[1, 2, 3, 5, 8]
```

### Constraints
- The array will contain between 1 and 100 integers.
- Each integer will be between -1000 and 1000.

### Complexity
- **Time:** O(n²) worst case
- **Space:** O(1) auxiliary
""",
        deadline="2026-07-15T23:59:59Z",
        status="not_started",
        templateCode="""def bubble_sort(arr):
    # Implement bubble sort here
    pass

# Read input
nums = list(map(int, input().split()))
result = bubble_sort(nums)
print(result)
""",
        language="python",
        testCases=[
            TestCase(id="tc-001-1", name="Basic unsorted", input="5 3 8 1 2", expectedOutput="[1, 2, 3, 5, 8]"),
            TestCase(id="tc-001-2", name="Already sorted", input="1 2 3 4 5", expectedOutput="[1, 2, 3, 4, 5]"),
            TestCase(id="tc-001-3", name="Reverse sorted", input="5 4 3 2 1", expectedOutput="[1, 2, 3, 4, 5]"),
            TestCase(id="tc-001-4", name="Single element", input="42", expectedOutput="[42]"),
            TestCase(id="tc-001-5", name="With negatives", input="-3 1 -1 0 2", expectedOutput="[-3, -1, 0, 1, 2]"),
        ],
    ),
    Assignment(
        id="assign-002",
        title="Linked List Reversal",
        description="""## Linked List Reversal

Implement a function to **reverse a singly linked list** and return the new head.

### Node Definition

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
```

### Function Signature

```python
def reverse_list(head):
    # Your code here
    pass
```

### Example

**Input:** `1 -> 2 -> 3 -> 4 -> 5`

**Output:** `5 -> 4 -> 3 -> 2 -> 1`

### Approach
Use an iterative three-pointer technique (prev, current, next) to reverse the links in-place.

### Constraints
- The number of nodes is in the range [0, 5000].
- Node values are between -5000 and 5000.

### Follow-up
Can you also implement this recursively?
""",
        deadline="2026-07-20T23:59:59Z",
        status="not_started",
        templateCode="""class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head):
    # Implement linked list reversal here
    pass

# Helper to build list from space-separated values
def build_list(values):
    dummy = ListNode(0)
    current = dummy
    for v in values:
        current.next = ListNode(v)
        current = current.next
    return dummy.next

# Helper to convert list to string
def list_to_str(head):
    vals = []
    while head:
        vals.append(str(head.val))
        head = head.next
    return " -> ".join(vals)

values = list(map(int, input().split()))
head = build_list(values)
reversed_head = reverse_list(head)
print(list_to_str(reversed_head))
""",
        language="python",
        testCases=[
            TestCase(id="tc-002-1", name="Standard list", input="1 2 3 4 5", expectedOutput="5 -> 4 -> 3 -> 2 -> 1"),
            TestCase(id="tc-002-2", name="Two elements", input="1 2", expectedOutput="2 -> 1"),
            TestCase(id="tc-002-3", name="Single element", input="7", expectedOutput="7"),
        ],
    ),
    Assignment(
        id="assign-003",
        title="Fibonacci Sequence",
        description="""## Fibonacci Sequence Generator

Write a function that returns the **n-th Fibonacci number** using an efficient approach.

### Definition

The Fibonacci sequence is defined as:
- F(0) = 0
- F(1) = 1
- F(n) = F(n-1) + F(n-2) for n > 1

### Function Signature

```javascript
function fibonacci(n) {
    // Your code here
}
```

### Examples

| Input | Output | Explanation              |
|-------|--------|--------------------------|
| 0     | 0      | F(0) = 0                 |
| 1     | 1      | F(1) = 1                 |
| 5     | 5      | 0,1,1,2,3,5              |
| 10    | 55     | ...34,55                 |

### Requirements
- Must handle n up to 50 efficiently (avoid naive recursion).
- Return the result as a number.

### Hints
- Use dynamic programming (memoization or bottom-up).
- Consider using BigInt for very large Fibonacci numbers.
""",
        deadline="2026-07-10T23:59:59Z",
        status="not_started",
        templateCode="""function fibonacci(n) {
    // Implement fibonacci here
    return 0;
}

const input = parseInt(require('readline').createInterface({input: process.stdin}).question('', ans => {
    console.log(fibonacci(parseInt(ans)));
    process.exit();
}));
""",
        language="javascript",
        testCases=[
            TestCase(id="tc-003-1", name="F(0)", input="0", expectedOutput="0"),
            TestCase(id="tc-003-2", name="F(1)", input="1", expectedOutput="1"),
            TestCase(id="tc-003-3", name="F(10)", input="10", expectedOutput="55"),
            TestCase(id="tc-003-4", name="F(20)", input="20", expectedOutput="6765"),
        ],
    ),
    Assignment(
        id="assign-004",
        title="String Reversal",
        description="""## String Reversal

Implement a function that **reverses a string** without using built-in reverse functions.

### Function Signature

```java
public class Solution {
    public static String reverseString(String s) {
        // Your code here
        return "";
    }
}
```

### Examples

**Input:** `"hello"`
**Output:** `"olleh"`

**Input:** `"abcdef"`
**Output:** `"fedcba"`

### Rules
- Do **NOT** use `StringBuilder.reverse()` or similar built-in methods.
- Implement the reversal logic manually (e.g., using a char array or two-pointer technique).
- The function should handle empty strings and single-character strings.

### Edge Cases
- Empty string `""` → `""`
- Single character `"a"` → `"a"`
- String with spaces `"ab cd"` → `"dc ba"`
""",
        deadline="2026-07-25T23:59:59Z",
        status="not_started",
        templateCode="""public class Solution {
    public static String reverseString(String s) {
        // Implement string reversal without built-in reverse
        return "";
    }

    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        String input = sc.nextLine();
        System.out.println(reverseString(input));
    }
}
""",
        language="java",
        testCases=[
            TestCase(id="tc-004-1", name="Basic string", input="hello", expectedOutput="olleh"),
            TestCase(id="tc-004-2", name="Empty string", input="", expectedOutput=""),
            TestCase(id="tc-004-3", name="Single character", input="a", expectedOutput="a"),
            TestCase(id="tc-004-4", name="With spaces", input="ab cd", expectedOutput="dc ba"),
            TestCase(id="tc-004-5", name="Palindrome", input="racecar", expectedOutput="racecar"),
        ],
    ),
    Assignment(
        id="assign-005",
        title="Binary Search",
        description="""## Binary Search Implementation

Implement the **Binary Search** algorithm to find the index of a target value in a sorted array.

### Algorithm

Binary Search works on sorted arrays by repeatedly dividing the search interval in half:
1. Compare the target with the middle element.
2. If the target equals the middle element, return its index.
3. If the target is less than the middle element, search the left half.
4. If the target is greater, search the right half.

### Function Signature

```python
def binary_search(arr, target):
    # Return the index of target, or -1 if not found
    pass
```

### Example

**Array:** `[1, 3, 5, 7, 9, 11, 13]`
**Target:** `7`
**Output:** `3`

**Array:** `[2, 4, 6, 8, 10]`
**Target:** `5`
**Output:** `-1`

### Input Format
- First line: space-separated integers (sorted array)
- Second line: target integer

### Output Format
- The index of the target, or `-1` if not found

### Complexity
- **Time:** O(log n)
- **Space:** O(1)
""",
        deadline="2026-07-18T23:59:59Z",
        status="not_started",
        templateCode="""def binary_search(arr, target):
    # Implement binary search here
    pass

nums = list(map(int, input().split()))
target = int(input())
result = binary_search(nums, target)
print(result)
""",
        language="python",
        testCases=[
            TestCase(id="tc-005-1", name="Target found middle", input="1 3 5 7 9 11 13\n7", expectedOutput="3"),
            TestCase(id="tc-005-2", name="Target not found", input="2 4 6 8 10\n5", expectedOutput="-1"),
            TestCase(id="tc-005-3", name="Target at beginning", input="1 2 3 4 5\n1", expectedOutput="0"),
            TestCase(id="tc-005-4", name="Target at end", input="10 20 30 40 50\n50", expectedOutput="4"),
        ],
    ),
]


@router.get("/assignments", response_model=list[Assignment])
def get_assignments():
    return ASSIGNMENTS


@router.get("/assignments/{assignment_id}", response_model=Assignment)
def get_assignment(assignment_id: str):
    for a in ASSIGNMENTS:
        if a.id == assignment_id:
            return a
    raise HTTPException(status_code=404, detail=f"Assignment '{assignment_id}' not found")
