<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# AGENTS.md
- Local Python server integration lives only in src/lib/island-bridge.ts (WebSocket stream + voice state); keeps the widget UI decoupled from transport.
- Voice visuals use one unified CSS state-driven seven-color animation for all speech; mic loudness drives scale via --level and continuously integrated orb/border rotation via --mic-angle without re-rendering, avoiding phase jumps; incoming bridge events supersede previews.
- The notch mascot uses a nested sprite puppet directed by one requestAnimationFrame motion hook with damped coordinated poses and secondary joint follow-through, rather than competing CSS joint loops; the portal handles screen reactions independently of voice visuals. Browser speech starts on a user gesture and incoming AI speaking state animates the puppet.
- Composer attachments retain browser File objects in session-only React state; file selection and local chat submission do not imply server upload or AI processing, keeping the frontend independent of the Python bridge.
