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
output_image: "assets/img/blog/id7.webp"
short_description: "A simple mouse logger in Windows using the Win32 SetWindowsHookEx API to capture low-level mouse click events."
end_description: ""
metaKeyword: "NA"
metaDescription: "A simple mouse logger in Windows using the Win32 SetWindowsHookEx API to capture low-level mouse click events."
active: "1"
---

## Overview

A mouse logger tracks mouse input events across Windows. In Win32 applications, global or low-level tracking can be implemented using Windows Hooks (`SetWindowsHookEx`) to register a callback procedure (`mouseProc`) that intercepts mouse messages before they reach target windows.

## C++ Source Code

```cpp
#include <Windows.h>
#include <stdio.h>

HHOOK hMouseHook;

LRESULT CALLBACK mouseProc(int nCode, WPARAM wParam, LPARAM lParam)
{
    MOUSEHOOKSTRUCT *pMouseStruct = (MOUSEHOOKSTRUCT *)lParam;
    if (pMouseStruct != NULL)
    {
        if (wParam == WM_LBUTTONDOWN) // When mouse left button is clicked
        {
            printf("Mouse is clicked.\n");
            MessageBox(NULL, "Mouse is clicked!", "Key Pressed", MB_ICONINFORMATION);
        }
    }

    return CallNextHookEx(hMouseHook, nCode, wParam, lParam);
}

// Set low-level mouse hook using the callback procedure above
void SetHook(void)
{
    hMouseHook = SetWindowsHookEx(WH_MOUSE_LL, mouseProc, NULL, 0);
}

// Release the registered mouse hook
void ReleaseHook(void)
{
    UnhookWindowsHookEx(hMouseHook);
}

int main(void)
{
    SetHook();
    MSG msg;
    // Standard Windows message pump
    while (GetMessage(&msg, NULL, 0, 0))
    {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    ReleaseHook();
    return 0;
}
```

## Key Technical Details

- **`WH_MOUSE_LL`**: Sets a low-level mouse hook that intercepts mouse input events in any desktop application.
- **`CallNextHookEx`**: Passes hook information to the next hook procedure in the current hook chain.
- **`UnhookWindowsHookEx`**: Ensures system hooks are cleanly released when the process terminates.
