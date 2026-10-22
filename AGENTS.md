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
- Voice visuals use one unified CSS state-driven seven-color animation for all speech; local preview never captures microphone audio and incoming bridge events supersede previews.
