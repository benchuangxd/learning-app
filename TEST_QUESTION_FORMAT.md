# Test Question Format

Test the new parser with your question format:

```markdown
**Question 10 (1 point)**

To extract the upper 8 bits from a 16-bit data, what is the first recommended operation?

Options:

A. Bitwise AND with `0xFF00` ✅ (1111 1111 0000 0000)

B. Logical AND with `0xFF00`

C. Bitwise OR with `0x00FF`

D. Left shift by 8 bits

E. Right shift by 8 bits

**Explanation:**

The first step is to **mask out the upper 8 bits** using a bitwise AND: `data & 0xFF00`. After masking, you can right-shift if you want the upper byte isolated as a standalone value.
```

## Parser Updates

✅ **Now supports:**
1. `**Explanation:**` header format (in addition to `— Explanation`)
2. Extra text after ✅ like: `✅ (1111 1111 0000 0000)`
3. Multi-line explanations after `**Explanation:**`
4. Up to 6 choices (A-F)
5. Inline markdown (backticks, bold) in text

## What Changed

### Before:
- Only supported `— Explanation` format
- Regex: `/^([A-F])\.\s*(.+?)(\s*✅)?$/` (stopped at ✅)

### After:
- Supports both `— Explanation` AND `**Explanation:**`
- Regex: `/^([A-F])\.\s*(.+?)(\s*✅.*)?$/` (captures everything after ✅)
- Includes parenthetical text in choice text if present

## Try It Now

1. Go to http://localhost:3001/questions
2. Paste your question in the import box
3. Click "Parse Questions"
4. Should now parse successfully! ✅

## Expected Result

**Question 10 should parse as:**
- Text: "To extract the upper 8 bits from a 16-bit data, what is the first recommended operation?"
- Points: 1
- Choices:
  - A. Bitwise AND with `0xFF00` (1111 1111 0000 0000) ✅ CORRECT
  - B. Logical AND with `0xFF00`
  - C. Bitwise OR with `0x00FF`
  - D. Left shift by 8 bits
  - E. Right shift by 8 bits
- Explanation: "The first step is to **mask out the upper 8 bits** using a bitwise AND: `data & 0xFF00`. After masking, you can right-shift if you want the upper byte isolated as a standalone value."
