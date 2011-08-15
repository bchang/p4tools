@echo off
rem Run p4blame Gosu script on Windows using gosu.cmd

set _GOSU="%GOSU_HOME%\bin\gosu.cmd"
if not exist "%_GOSU%" goto noGosuHome

call %GOSU_HOME%\bin\gosu.cmd %~dp0\p4blame.gsp %*
goto end

:noGosuHome
echo Could not find gosu.cmd executable %_GOSU%
echo check your GOSU_HOME environment variable

:end
