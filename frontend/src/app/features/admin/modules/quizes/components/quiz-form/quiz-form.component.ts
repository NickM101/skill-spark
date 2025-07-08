// src/app/features/admin/modules/quizzes/components/quiz-form/quiz-form.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QuizService } from '../../services/quiz.service';
import { QuestionType, AddQuestionDto } from '@core/models/question.model';
import { Quiz, CreateQuizDto, UpdateQuizDto } from '@core/models/quiz.model';
import { SharedModule } from '@shared/shared.module';

@Component({
  selector: 'app-quiz-form',
  templateUrl: './quiz-form.component.html',
  styleUrls: ['./quiz-form.component.scss'],
  imports: [SharedModule]
})
export class QuizFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  quizForm!: FormGroup;
  loading$ = new BehaviorSubject<boolean>(false);
  isEditMode = false;
  quizId: string | null = null;
  courseId: string | null = null;
  currentQuiz: Quiz | null = null;

  // Question Types
  questionTypes = [
    { value: QuestionType.MULTIPLE_CHOICE, label: 'Multiple Choice' },
    { value: QuestionType.TRUE_FALSE, label: 'True/False' },
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.quizId = params['id'] || null;
      this.courseId = params['courseId'] || null;
      this.isEditMode = !!this.quizId;

      if (this.isEditMode) {
        this.loadQuiz();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the reactive form
   */
  private initializeForm(): void {
    this.quizForm = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      description: ['', [Validators.maxLength(500)]],
      timeLimit: [null, [Validators.min(1), Validators.max(300)]],
      passingScore: [
        70,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      questions: this.fb.array([]),
    });
  }

  /**
   * Get questions form array
   */
  get questions(): FormArray {
    return this.quizForm.get('questions') as FormArray;
  }

  /**
   * Load quiz data for editing
   */
  private loadQuiz(): void {
    if (!this.quizId) return;

    this.loading$.next(true);
    this.quizService
      .getQuizById(this.quizId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (quiz) => {
          this.currentQuiz = quiz;
          this.populateForm(quiz);
          this.loading$.next(false);
        },
        error: (error) => {
          this.snackBar.open(`Failed to load quiz: ${error.message}`, 'Close', {
            duration: 5000,
          });
          this.loading$.next(false);
          this.router.navigate(['/admin/quizzes']);
        },
      });
  }

  /**
   * Populate form with quiz data
   */
  private populateForm(quiz: Quiz): void {
    this.quizForm.patchValue({
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      passingScore: quiz.passingScore,
    });

    // Add existing questions
    if (quiz.questions) {
      quiz.questions.forEach((question) => {
        this.addExistingQuestion(question);
      });
    }
  }

  /**
   * Add existing question to form
   */
  private addExistingQuestion(question: any): void {
    const questionGroup = this.fb.group({
      id: [question.id],
      question: [
        question.question,
        [Validators.required, Validators.minLength(5)],
      ],
      type: [question.type, Validators.required],
      options: this.fb.array(question.options || []),
      correctAnswers: [question.correctAnswers, Validators.required],
      points: [question.points, [Validators.required, Validators.min(1)]],
    });

    this.questions.push(questionGroup);
  }

  /**
   * Add new question to form
   */
  addQuestion(): void {
    const questionGroup = this.fb.group({
      id: [null],
      question: ['', [Validators.required, Validators.minLength(5)]],
      type: [QuestionType.MULTIPLE_CHOICE, Validators.required],
      options: this.fb.array(['', '', '', '']), // Default 4 options for MCQ
      correctAnswers: [[], Validators.required],
      points: [1, [Validators.required, Validators.min(1)]],
    });

    this.questions.push(questionGroup);
  }

  /**
   * Remove question from form
   */
  removeQuestion(index: number): void {
    this.questions.removeAt(index);
  }

  /**
   * Get options form array for a question
   */
  getQuestionOptions(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  /**
   * Add option to a question
   */
  addOption(questionIndex: number): void {
    const options = this.getQuestionOptions(questionIndex);
    options.push(this.fb.control(''));
  }

  /**
   * Remove option from a question
   */
  removeOption(questionIndex: number, optionIndex: number): void {
    const options = this.getQuestionOptions(questionIndex);
    if (options.length > 2) {
      // Minimum 2 options
      options.removeAt(optionIndex);
    }
  }

  /**
   * Handle question type change
   */
  onQuestionTypeChange(questionIndex: number, type: QuestionType): void {
    const question = this.questions.at(questionIndex);
    const optionsArray = this.getQuestionOptions(questionIndex);

    if (type === QuestionType.TRUE_FALSE) {
      // Clear and set True/False options
      optionsArray.clear();
      optionsArray.push(this.fb.control('True'));
      optionsArray.push(this.fb.control('False'));
      question.get('correctAnswers')?.setValue([]);
    } else if (type === QuestionType.MULTIPLE_CHOICE) {
      // Clear and set default MCQ options
      optionsArray.clear();
      for (let i = 0; i < 4; i++) {
        optionsArray.push(this.fb.control(''));
      }
      question.get('correctAnswers')?.setValue([]);
    }
  }

  /**
   * Handle correct answer selection
   */
  onCorrectAnswerChange(
    questionIndex: number,
    optionIndex: number,
    isSelected: boolean
  ): void {
    const question = this.questions.at(questionIndex);
    const currentCorrect = question.get('correctAnswers')?.value || [];
    const optionValue = optionIndex.toString();

    let newCorrect: string[];
    if (isSelected) {
      newCorrect = [...currentCorrect, optionValue];
    } else {
      newCorrect = currentCorrect.filter(
        (index: string) => index !== optionValue
      );
    }

    question.get('correctAnswers')?.setValue(newCorrect);
  }

  /**
   * Check if option is correct answer
   */
  isCorrectAnswer(questionIndex: number, optionIndex: number): boolean {
    const question = this.questions.at(questionIndex);
    const correctAnswers = question.get('correctAnswers')?.value || [];
    return correctAnswers.includes(optionIndex.toString());
  }

  /**
   * Submit the form
   */
  onSubmit(): void {
    if (this.quizForm.invalid) {
      this.markFormGroupTouched(this.quizForm);
      this.snackBar.open(
        'Please fill in all required fields correctly',
        'Close',
        { duration: 5000 }
      );
      return;
    }

    this.loading$.next(true);
    const formValue = this.quizForm.value;

    if (this.isEditMode) {
      this.updateQuiz(formValue);
    } else {
      this.createQuiz(formValue);
    }
  }

  /**
   * Create new quiz
   */
  private createQuiz(formValue: any): void {
    if (!this.courseId) {
      this.snackBar.open('Course ID is required to create a quiz', 'Close', {
        duration: 5000,
      });
      this.loading$.next(false);
      return;
    }

    const createDto: CreateQuizDto = {
      title: formValue.title,
      description: formValue.description,
      timeLimit: formValue.timeLimit,
      passingScore: formValue.passingScore,
    };

    this.quizService
      .createQuiz(this.courseId, createDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (quiz) => {
          this.snackBar.open('Quiz created successfully', 'Close', {
            duration: 3000,
          });
          this.loading$.next(false);

          // Add questions if any
          if (formValue.questions && formValue.questions.length > 0) {
            this.addQuestionsToQuiz(quiz.id, formValue.questions);
          } else {
            this.router.navigate(['/admin/quizzes', quiz.id]);
          }
        },
        error: (error) => {
          this.snackBar.open(
            `Failed to create quiz: ${error.message}`,
            'Close',
            { duration: 5000 }
          );
          this.loading$.next(false);
        },
      });
  }

  /**
   * Update existing quiz
   */
  private updateQuiz(formValue: any): void {
    if (!this.quizId) return;

    const updateDto: UpdateQuizDto = {
      title: formValue.title,
      description: formValue.description,
      timeLimit: formValue.timeLimit,
      passingScore: formValue.passingScore,
    };

    this.quizService
      .updateQuiz(this.quizId, updateDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (quiz) => {
          this.snackBar.open('Quiz updated successfully', 'Close', {
            duration: 3000,
          });
          this.loading$.next(false);
          this.router.navigate(['/admin/quizzes', quiz.id]);
        },
        error: (error) => {
          this.snackBar.open(
            `Failed to update quiz: ${error.message}`,
            'Close',
            { duration: 5000 }
          );
          this.loading$.next(false);
        },
      });
  }

  /**
   * Add questions to quiz
   */
  private addQuestionsToQuiz(quizId: string, questions: any[]): void {
    const questionPromises = questions.map((question) => {
      const addQuestionDto: AddQuestionDto = {
        question: question.question,
        type: question.type,
        options: question.options.filter((opt: string) => opt.trim() !== ''),
        correctAnswers: question.correctAnswers,
        points: question.points,
      };

      return this.quizService.addQuestion(quizId, addQuestionDto).toPromise();
    });

    Promise.all(questionPromises)
      .then(() => {
        this.snackBar.open('All questions added successfully', 'Close', {
          duration: 3000,
        });
        this.router.navigate(['/admin/quizzes', quizId]);
      })
      .catch((error) => {
        this.snackBar.open(
          `Some questions failed to add: ${error.message}`,
          'Close',
          { duration: 5000 }
        );
        this.router.navigate(['/admin/quizzes', quizId]);
      });
  }

  /**
   * Cancel form and navigate back
   */
  onCancel(): void {
    if (this.isEditMode && this.quizId) {
      this.router.navigate(['/admin/quizzes', this.quizId]);
    } else {
      this.router.navigate(['/admin/quizzes']);
    }
  }

  /**
   * Mark all form fields as touched for validation
   */
  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched({ onlySelf: true });
      }
    });
  }

  /**
   * Get form control error message
   */
  getErrorMessage(controlName: string, questionIndex?: number): string {
    let control;
    if (questionIndex !== undefined) {
      control = this.questions.at(questionIndex).get(controlName);
    } else {
      control = this.quizForm.get(controlName);
    }

    if (control?.hasError('required')) {
      return `${controlName} is required`;
    }
    if (control?.hasError('minlength')) {
      return `${controlName} is too short`;
    }
    if (control?.hasError('maxlength')) {
      return `${controlName} is too long`;
    }
    if (control?.hasError('min')) {
      return `${controlName} must be greater than ${control.errors?.['min'].min}`;
    }
    if (control?.hasError('max')) {
      return `${controlName} must be less than ${control.errors?.['max'].max}`;
    }
    return '';
  }
}
