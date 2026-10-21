package com.example.aianalytics.similarity;

import com.example.aianalytics.common.ApiDtos.FindingDto;
import com.example.aianalytics.data.*;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Pattern;

@Service
public class SimilarityService {
    private static final Pattern WORD = Pattern.compile("[\\p{L}\\p{N}]+(?:['’][\\p{L}\\p{N}]+)?");
    private final WorkspaceService workspace;
    private final InteractionRepository interactions;
    private final FinalWorkSectionRepository sections;
    private final ReviewRecordRepository reviews;

    public SimilarityService(WorkspaceService workspace, InteractionRepository interactions,
                             FinalWorkSectionRepository sections, ReviewRecordRepository reviews) {
        this.workspace=workspace; this.interactions=interactions; this.sections=sections; this.reviews=reviews;
    }

    @Transactional(readOnly=true)
    public List<FindingDto> calculate(Long assessmentId, Authentication auth) {
        workspace.assessmentEntityForOwner(assessmentId, auth);
        var outputs=interactions.findAllByAssessmentIdAndTypeOrderByOccurredAtDesc(assessmentId, Interaction.Type.AI_OUTPUT);
        var finalSections=sections.findAllByAssessmentIdOrderByPositionAscIdAsc(assessmentId);
        var results=new ArrayList<FindingDto>();
        for (var output : outputs) for (var section : output.getSection() == null ? finalSections : List.of(output.getSection())) {
            var finalPhrases=phrases(section.getContent());
            var aiPhrases=phrases(output.getContent());
            var enough=!finalPhrases.isEmpty();
            var matches=finalPhrases.stream().filter(aiPhrases::contains).toList();
            Integer percent=enough ? (int)Math.round((matches.size()*100.0)/finalPhrases.size()) : null;
            var review=reviews.findByAssessmentIdAndInteractionIdAndSectionId(assessmentId, output.getId(), section.getId()).orElse(null);
            results.add(new FindingDto(output.getId()+":"+section.getId(), output.getId(), section.getId(), section.getTitle(), output.getTitle(), percent,
                matches, output.getContent(), section.getContent(), review==null ? "OPEN" : review.getStatus().name(), review==null ? null : review.getNote(), enough));
        }
        results.sort(Comparator.comparing(FindingDto::similarityPercent, Comparator.nullsLast(Comparator.reverseOrder())));
        return results;
    }

    static Set<String> phrases(String text) {
        var tokens=new ArrayList<String>();
        var matcher=WORD.matcher(text.toLowerCase(Locale.ROOT));
        while (matcher.find()) tokens.add(matcher.group());
        var phrases=new LinkedHashSet<String>();
        for (int i=0; i+5<=tokens.size(); i++) phrases.add(String.join(" ", tokens.subList(i, i+5)));
        return phrases;
    }
}
