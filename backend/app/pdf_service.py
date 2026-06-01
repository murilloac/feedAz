from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from io import BytesIO
from datetime import datetime
import json

def generate_feedback_pdf(feedback_data):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        rightMargin=2*cm, 
        leftMargin=2*cm, 
        topMargin=2.5*cm, 
        bottomMargin=2*cm,
        title="Feedback One-on-One"
    )
    
    styles = getSampleStyleSheet()
    
    # Estilos personalizados corporativos
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#0066cc'),
        spaceAfter=8,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#666666'),
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    
    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#0066cc'),
        spaceAfter=10,
        spaceBefore=15,
        fontName='Helvetica-Bold',
        borderPadding=5,
        backColor=colors.HexColor('#f0f7ff'),
        leftIndent=10
    )
    
    content_style = ParagraphStyle(
        'Content',
        parent=styles['BodyText'],
        fontSize=10,
        textColor=colors.HexColor('#333333'),
        spaceAfter=10,
        alignment=TA_JUSTIFY,
        fontName='Helvetica',
        leading=14
    )
    
    label_style = ParagraphStyle(
        'Label',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#666666'),
        fontName='Helvetica-Bold'
    )
    
    story = []
    
    # Cabeçalho
    story.append(Paragraph("REGISTRO DE FEEDBACK ONE-ON-ONE", title_style))
    story.append(Paragraph("Avaliação de Desempenho e Desenvolvimento Profissional", subtitle_style))
    story.append(Spacer(1, 0.3*cm))
    
    # Linha separadora
    line_table = Table([['']], colWidths=[17*cm])
    line_table.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 2, colors.HexColor('#0066cc')),
    ]))
    story.append(line_table)
    story.append(Spacer(1, 0.5*cm))
    
    # Informações do Colaborador
    data_feedback_formatted = feedback_data.get('data_feedback', '')
    if isinstance(data_feedback_formatted, datetime):
        data_feedback_formatted = data_feedback_formatted.strftime('%d/%m/%Y')
    
    info_data = [
        ['Colaborador:', feedback_data.get('funcionario_nome', 'N/A')],
        ['Líder:', feedback_data.get('lider_nome', 'N/A')],
        ['Área:', feedback_data.get('area', 'N/A')],
        ['Data do Feedback:', data_feedback_formatted]
    ]
    
    info_table = Table(info_data, colWidths=[4*cm, 13*cm])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8f9fa')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#0066cc')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#333333')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dee2e6')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    story.append(info_table)
    story.append(Spacer(1, 0.8*cm))
    
    # Indicadores de Desempenho
    if feedback_data.get('indicadores'):
        story.append(Paragraph("■ INDICADORES DE DESEMPENHO", section_title_style))
        
        try:
            indicadores_valores = json.loads(feedback_data['indicadores'])
            if indicadores_valores:
                ind_data = [['Indicador', 'Meta', 'Resultado']]
                for ind in indicadores_valores:
                    ind_data.append([
                        ind.get('indicator_nome', 'N/A'),
                        ind.get('indicator_meta', '-'),
                        ind.get('valor', '-')
                    ])
                
                ind_table = Table(ind_data, colWidths=[7*cm, 5*cm, 5*cm])
                ind_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0066cc')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 1), (-1, -1), 9),
                    ('TOPPADDING', (0, 0), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dee2e6')),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
                ]))
                story.append(ind_table)
        except:
            story.append(Paragraph(feedback_data['indicadores'], content_style))
        
        story.append(Spacer(1, 0.5*cm))
    
    # Assiduidade
    if feedback_data.get('assiduidade'):
        story.append(Paragraph("■ ASSIDUIDADE E PONTUALIDADE", section_title_style))
        story.append(Paragraph(feedback_data['assiduidade'], content_style))
        story.append(Spacer(1, 0.3*cm))
    
    # Aderência
    if feedback_data.get('aderencia'):
        story.append(Paragraph("■ ADERÊNCIA A PROCESSOS E PROCEDIMENTOS", section_title_style))
        story.append(Paragraph(feedback_data['aderencia'], content_style))
        story.append(Spacer(1, 0.3*cm))
    
    # Pontos Positivos
    if feedback_data.get('pontos_positivos'):
        story.append(Paragraph("■ PONTOS FORTES E CONQUISTAS", section_title_style))
        story.append(Paragraph(feedback_data['pontos_positivos'], content_style))
        story.append(Spacer(1, 0.3*cm))
    
    # Pontos de Melhoria
    if feedback_data.get('melhorias'):
        story.append(Paragraph("■ OPORTUNIDADES DE DESENVOLVIMENTO", section_title_style))
        story.append(Paragraph(feedback_data['melhorias'], content_style))
        story.append(Spacer(1, 0.3*cm))
    
    # Comentário do Colaborador
    if feedback_data.get('comentario_colaborador'):
        story.append(Paragraph("■ CONSIDERAÇÕES DO COLABORADOR", section_title_style))
        story.append(Paragraph(feedback_data['comentario_colaborador'], content_style))
        story.append(Spacer(1, 0.5*cm))
    
    # Assinatura Digital
    story.append(Spacer(1, 1*cm))
    
    signature_data = []
    if feedback_data.get('assinado'):
        assinatura_data = feedback_data.get('data_assinatura', '')
        if isinstance(assinatura_data, datetime):
            assinatura_data = assinatura_data.strftime('%d/%m/%Y às %H:%M')
        
        signature_data.append(['Status:', 'Documento Assinado Digitalmente'])
        signature_data.append(['Data da Assinatura:', assinatura_data])
        signature_data.append(['Assinado por:', feedback_data.get('funcionario_nome', 'N/A')])
    else:
        signature_data.append(['Status:', 'Aguardando Assinatura do Colaborador'])
    
    sig_table = Table(signature_data, colWidths=[4*cm, 13*cm])
    sig_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0f7ff')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#0066cc')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#0066cc')),
    ]))
    
    story.append(sig_table)
    
    # Rodapé
    story.append(Spacer(1, 1*cm))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#999999'),
        alignment=TA_CENTER,
        fontName='Helvetica-Oblique'
    )
    story.append(Paragraph(
        "Este documento é confidencial e destinado exclusivamente ao colaborador e gestor mencionados.",
        footer_style
    ))
    story.append(Paragraph(
        f"Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')} pelo Sistema FeedAz.",
        footer_style
    ))
    
    doc.build(story)
    buffer.seek(0)
    return buffer
