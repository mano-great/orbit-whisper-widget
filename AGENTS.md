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
- The notch mascot uses a nested sprite puppet with independent neck, shoulders, elbows, wrists, hips, knees, ankles, ears and facial overlays; joint transforms preserve attachment, while a portal allows screen reactions without changing voice visuals. Browser speech starts on a user gesture and incoming AI speaking state also animates the puppet.
