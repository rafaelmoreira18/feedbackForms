import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FormTemplateEntity,
  FormTemplateBlockEntity,
  FormQuestionEntity,
} from './form-template.entity';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { TenantService } from '../tenants/tenant.service';

@Injectable()
export class FormTemplateService {
  constructor(
    private readonly tenantService: TenantService,
    @InjectRepository(FormTemplateEntity)
    private readonly templateRepo: Repository<FormTemplateEntity>,
    @InjectRepository(FormTemplateBlockEntity)
    private readonly blockRepo: Repository<FormTemplateBlockEntity>,
    @InjectRepository(FormQuestionEntity)
    private readonly questionRepo: Repository<FormQuestionEntity>,
  ) {}

  async findByTenantSlug(tenantSlug: string): Promise<FormTemplateEntity[]> {
    const tenant = await this.tenantService.findBySlug(tenantSlug);
    const templates = await this.templateRepo.find({
      where: { tenantId: tenant.id, active: true },
      relations: { blocks: { questions: true } },
      order: { name: 'ASC' },
    });
    return templates.map((t) => this.sortedTemplate(t));
  }

  async findByTenantSlugAndFormSlug(
    tenantSlug: string,
    formSlug: string,
  ): Promise<FormTemplateEntity> {
    const tenant = await this.tenantService.findBySlug(tenantSlug);
    const template = await this.templateRepo.findOne({
      where: { tenantId: tenant.id, slug: formSlug, active: true },
      relations: { blocks: { questions: true } },
    });
    if (!template) {
      throw new NotFoundException(`Form template '${formSlug}' not found for this tenant`);
    }
    return this.sortedTemplate(template);
  }

  async create(tenantSlug: string, dto: CreateFormTemplateDto): Promise<FormTemplateEntity> {
    const tenant = await this.tenantService.findBySlug(tenantSlug);

    const existing = await this.templateRepo.findOne({
      where: { tenantId: tenant.id, slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Template slug '${dto.slug}' already exists for this tenant`);
    }

    const template = this.templateRepo.create({ tenantId: tenant.id, slug: dto.slug, name: dto.name });
    const saved = await this.templateRepo.save(template);

    for (let bi = 0; bi < dto.blocks.length; bi++) {
      const blockDto = dto.blocks[bi];
      const block = this.blockRepo.create({
        templateId: saved.id,
        title: blockDto.title,
        order: bi,
      });
      const savedBlock = await this.blockRepo.save(block);

      for (let qi = 0; qi < blockDto.questions.length; qi++) {
        const q = blockDto.questions[qi];
        await this.questionRepo.save(
          this.questionRepo.create({
            blockId: savedBlock.id,
            questionKey: q.questionKey,
            text: q.text,
            scale: q.scale,
            subReasons: q.subReasons ?? null,
            order: qi,
          }),
        );
      }
    }

    return this.findByTenantSlugAndFormSlug(tenantSlug, dto.slug);
  }

  private sortedTemplate(template: FormTemplateEntity): FormTemplateEntity {
    template.blocks = template.blocks
      .sort((a, b) => a.order - b.order)
      .map((block) => {
        block.questions = block.questions.sort((a, b) => a.order - b.order);
        return block;
      });
    return template;
  }
}
