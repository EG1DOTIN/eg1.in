---
id: "7"
title: "A simple mouse logger in windows using c++"
heading: "A simple mouse logger in windows using c++"
category: "c++"
tags: ["c++"]
author: "EG1"
createdAt: "2017-02-23"
release_date: "2017-02-23"
updatedAt: "2026-07-15T09:53:55.572Z"
output_image: "img/blog/id7.webp"
short_description: "The mouse logger is an important tool to track computer mouse input activities. Here the simple example of mouse logger is shown. A callback function (procedure) is defined for mouse to track its activities. This procedure is called every time by SetWindowsHookEx function when a mouse input is applied."
end_description: ""
metaKeyword: "NA"
metaDescription: "NA"
active: "1"
---

```cpp
#include <Windows.h>
#include <stdio.h>

HHOOK hMouseHook;

LRESULT CALLBACK mouseProc(int nCode, WPARAM wParam, LPARAM lParam)
{
     MOUSEHOOKSTRUCT * pMouseStruct = (MOUSEHOOKSTRUCT *)lParam;
     if (pMouseStruct != NULL)
     {
           if (wParam == WM_LBUTTONDOWN) //When mouse left button is clicked.
           {
                printf("Mouse isclicked.\n");
                MessageBox(NULL, "mouse is clicked!!!", "key pressed", MB_ICONINFORMATION);
           }
     }

     return CallNextHookEx(hMouseHook, nCode, wParam, lParam);
}

/*Set the hook and set it to use the callback function above. 
WH_MOUSE_LL means it will set a low level mouse hook. 
More information about it at MSDN. 
The last 2 parameters are NULL, 0 because the callback function 
is in the same thread and window as the function that sets and releases the hook. 
If you create a hack you will not need the callback function in another place then your own code file anyway.
Read more about it at MSDN. */

void SetHook()
{
     hMouseHook = SetWindowsHookEx(WH_MOUSE_LL, mouseProc, NULL, 0);
}

void ReleaseHook()
{
     //If you need to release thismouse hook, call this function.
     UnhookWindowsHookEx(hMouseHook);
}

int main()
{
     SetHook();
     MSG message;

     while (GetMessage(&message, NULL, 0, 0))
     {
           ;
     }

     return 0;
}
```
