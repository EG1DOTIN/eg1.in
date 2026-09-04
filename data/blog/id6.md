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
output_image: "img/blog/id6.webp"
short_description: "Here we have used the concept of boolean algebra. We know that the outputs of half adder is (Sum = A XOR B , Carry = A AND B ) and in the full adder the carry is added to the sum and also in the parallel adder the output carry is shifting in the left side. in c or c++, XOR, AND and Left Shift operations are defined using ^ , &amp;, &lt;&lt; operators respectively."
end_description: ""
metaKeyword: "half adderhalf adder in c, XOR gate, XOR gate in c, full adder in c, parallel adder in c,carriage shifting in c, XOR, AND gate in c, Left Shift operator in c, adding integer without + operator, XOR operator in c, AND operator in c, boolean algebra in c,"
metaDescription: "Adding two integer numbers without using plus operator in c"
active: "1"
---

```c
#include<stdio.h>
#include<conio.h>

int FullAdder(int x, int y)
{
     int S = (x) ^ (y);        //Output Sum Of Half Adder
     int C = (x)&  (y);        //Output Carry Of Half Adder

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

int main()
{
     printf("Sum of 57863, 78437 = %d\n", FullAdder(57863, 78437));
     printf("Sum of 34567, 23453 = %d\n", FullAdder(34567, 23453));
     printf("Sum of 57863, 78437, 34654 = %d\n", FullAdder(FullAdder(57863, 78437), 34654));
     printf("Sum of 57, 784,4354,64657,344546 = %d\n", FullAdder(FullAdder(FullAdder(57, 784), FullAdder(4354, 64657)), 344546));

     _getch();
     return 0;
}
```
