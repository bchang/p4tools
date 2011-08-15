@echo off
rem Run p4blame Gosu script on Windows using gosu.cmd
call %GOSU_HOME%\bin\gosu.cmd %~dp0\p4blame.gsp %*

