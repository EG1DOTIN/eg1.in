---
id: "6"
title: "Adding two integer numbers without using plus operator in c"
heading: "Adding two integer numbers without using plus operator in c"
category: "c"
tags: ["c"]
author: "EG1"
createdAt: "2017-02-16"
release_date: "2017-02-16"
updatedAt: "2026-07-15T11:26:10.205Z"
output_image: "assets/img/blog/id6.webp"
short_description: "Implement binary integer addition without using the plus (+) operator in C using bitwise XOR, AND, and left shifts."
end_description: ""
metaKeyword: "half adderhalf adder in c, XOR gate, XOR gate in c, full adder in c, parallel adder in c,carriage shifting in c, XOR, AND gate in c, Left Shift operator in c, adding integer without + operator, XOR operator in c, AND operator in c, boolean algebra in c,"
metaDescription: "Implement binary integer addition without using the plus (+) operator in C using bitwise XOR, AND, and left shifts."
active: "1"
---

## Overview

In digital electronics and binary arithmetic, addition can be performed without using the arithmetic plus operator ('+') by leveraging boolean logic gates:

- **Half Adder**:
  - $\text{Sum} = A \oplus B$ (Bitwise XOR: `A ^ B`)
  - $\text{Carry} = A \cdot B$ (Bitwise AND: `A & B`)
- **Full Adder**: The carry is shifted to the left by 1 bit (`Carry << 1`) and added back into the sum iteratively or recursively until no carry remains.

## C Source Code

```c
#include <stdio.h>
#include <conio.h>

int FullAdder(int x, int y)
{
    int S = (x) ^ (y); // Output Sum Of Half Adder
    int C = (x) & (y); // Output Carry Of Half Adder

    if (y == 0)
    {
        return x;
    }
    else if (x == 0)
    {
        return y;
    }
    else
    {
        return FullAdder(S, C << 1);
    }
}

int main(void)
{
    printf("Sum of 57863, 78437 = %d\n", FullAdder(57863, 78437));
    printf("Sum of 34567, 23453 = %d\n", FullAdder(34567, 23453));
    printf("Sum of 57863, 78437, 34654 = %d\n", FullAdder(FullAdder(57863, 78437), 34654));
    printf("Sum of 57, 784, 4354, 64657, 344546 = %d\n",
           FullAdder(FullAdder(FullAdder(57, 784), FullAdder(4354, 64657)), 344546));

    _getch();
    return 0;
}
```

## How It Works

1. **Sum (`x ^ y`)**: Adds bits where exactly one operand has a '1'.
2. **Carry (`(x & y) << 1`)**: Detects carry bits and shifts them one place left to the next higher significance.
3. **Recursive Step**: Recursively passes 'S' and `C << 1` until the carry 'y' becomes zero, leaving the final computed sum.
